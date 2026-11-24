import { NextResponse } from "next/server";
import { requireAdmin, isAdminContext } from "@/lib/admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = await requireAdmin(request);
  if (!isAdminContext(context)) return context;
  const { admin } = context;
  const [products, categories, orders, logs, team] = await Promise.all([
    admin.from("products").select("id,sku,slug,name,brand,hsn_code,gst_rate,price,compare_at_price,stock_quantity,stock_status,is_featured,is_active,category_id,created_at,updated_at").order("updated_at", { ascending: false }).limit(500),
    admin.from("categories").select("id,parent_id,name,slug,icon,description,sort_order,is_active").order("sort_order"),
    admin.from("orders").select("id,order_number,status,payment_status,grand_total,currency,placed_at").order("placed_at", { ascending: false }).limit(100),
    admin.from("audit_logs").select("id,actor_user_id,action,entity_type,entity_id,details,created_at").order("created_at", { ascending: false }).limit(100)
  ]);
  const failure = products.error || categories.error || orders.error || logs.error || team.error;
  if (failure) return NextResponse.json({ error: "Unable to load the Admin workspace data." }, { status: 500 });
  return NextResponse.json({ products: products.data, categories: categories.data, orders: orders.data, activity: logs.data, team: team.data, admin: { role: context.role } });
}

export async function POST(request: Request) {
  const context = await requireAdmin(request);
  if (!isAdminContext(context)) return context;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  const { admin, userId } = context;

  if (body.type === "category") {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const parentId = typeof body.parentId === "string" && body.parentId ? body.parentId : null;
    if (!name || name.length > 100) return NextResponse.json({ error: "Category name is required (maximum 100 characters)." }, { status: 400 });
    const slug = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data, error } = await admin.from("categories").insert({ name, slug, parent_id: parentId, is_active: true }).select().single();
    if (error) return NextResponse.json({ error: error.code === "23505" ? "That category already exists." : "Could not create category." }, { status: 400 });
    await admin.from("audit_logs").insert({ actor_user_id: userId, action: "category.created", entity_type: "category", entity_id: data.id, details: { name } });
    return NextResponse.json({ category: data }, { status: 201 });
  }

  if (body.type === "product") {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const price = Number(body.price);
    const stock = Number(body.stock_quantity ?? 0);
    const gst = Number(body.gst_rate ?? 0);
    if (!name || name.length > 180 || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0 || !Number.isFinite(gst) || gst < 0 || gst > 100) {
      return NextResponse.json({ error: "Check product name, price, stock quantity and GST rate." }, { status: 400 });
    }
    const slugBase = (typeof body.slug === "string" && body.slug.trim() ? body.slug : name).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const slug = slugBase + "-" + crypto.randomUUID().slice(0, 8);
    const payload = {
      name, slug, sku: typeof body.sku === "string" ? body.sku.trim() || null : null,
      brand: typeof body.brand === "string" ? body.brand.trim() || null : null,
      hsn_code: typeof body.hsn_code === "string" ? body.hsn_code.trim() || null : null,
      category_id: typeof body.category_id === "string" && body.category_id ? body.category_id : null,
      price, stock_quantity: stock, gst_rate: gst, compare_at_price: body.compare_at_price == null || body.compare_at_price === "" ? null : Number(body.compare_at_price),
      stock_status: stock > 0 ? "in_stock" : "out_of_stock", is_active: body.is_active !== false
    };
    const { data, error } = await admin.from("products").insert(payload).select().single();
    if (error) return NextResponse.json({ error: "Could not create product. Check SKU and category values." }, { status: 400 });
    await admin.from("audit_logs").insert({ actor_user_id: userId, action: "product.created", entity_type: "product", entity_id: data.id, details: { name, sku: payload.sku, stock_quantity: stock } });
    return NextResponse.json({ product: data }, { status: 201 });
  }
  return NextResponse.json({ error: "Unsupported Admin action." }, { status: 400 });
}

export async function PATCH(request: Request) {
  const context = await requireAdmin(request);
  if (!isAdminContext(context)) return context;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string") return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
  const updates: Record<string, unknown> = {};
  for (const key of ["name","sku","brand","hsn_code","category_id","price","compare_at_price","gst_rate","is_active","is_featured"]) {
    if (key in body) updates[key] = key === "category_id" && body[key] === "" ? null : body[key];
  }
  if ("stock_quantity" in body) {
    const stock = Number(body.stock_quantity);
    if (!Number.isInteger(stock) || stock < 0) return NextResponse.json({ error: "Stock must be a non-negative whole number." }, { status: 400 });
    updates.stock_quantity = stock;
    updates.stock_status = stock > 0 ? "in_stock" : "out_of_stock";
  }
  if (typeof updates.name === "string" && !updates.name.trim()) return NextResponse.json({ error: "Product name cannot be empty." }, { status: 400 });
  const { admin, userId } = context;
  const { data: before } = await admin.from("products").select("id,name,stock_quantity").eq("id", body.id).maybeSingle();
  if (!before) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  const { data, error } = await admin.from("products").update(updates).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: "Could not update product." }, { status: 400 });
  await admin.from("audit_logs").insert({ actor_user_id: userId, action: "stock_quantity" in updates ? "stock.adjusted" : "product.updated", entity_type: "product", entity_id: data.id, details: { before, changes: updates, reason: typeof body.stock_reason === "string" ? body.stock_reason : null } });
  return NextResponse.json({ product: data });
}

export async function DELETE(request: Request) {
  const context = await requireAdmin(request);
  if (!isAdminContext(context)) return context;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string") return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
  const { admin, userId } = context;
  const { data, error } = await admin.from("products").update({ is_active: false }).eq("id", body.id).select("id,name").single();
  if (error) return NextResponse.json({ error: "Could not archive product." }, { status: 400 });
  await admin.from("audit_logs").insert({ actor_user_id: userId, action: "product.archived", entity_type: "product", entity_id: data.id, details: { name: data.name } });
  return NextResponse.json({ success: true });
}
