import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorize(request: Request, storeId: string) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return { error: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }) };
  const url = process.env.NEXT_PUBLIC_SUPABASE_ECOMMERCE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return { error: NextResponse.json({ error: "Store access is not configured." }, { status: 503 }) };
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return { error: NextResponse.json({ error: "Your session is invalid. Sign in again." }, { status: 401 }) };
  const { data: membership, error } = await admin.from("partner_store_members")
    .select("role,partner_stores!inner(id,status)").eq("store_id", storeId)
    .eq("user_id", auth.user.id).eq("is_active", true).eq("partner_stores.status", "active").maybeSingle();
  if (error) return { error: NextResponse.json({ error: "Unable to verify Store membership." }, { status: 503 }) };
  if (!membership) return { error: NextResponse.json({ error: "You do not have access to this Store." }, { status: 403 }) };
  return { admin, userId: auth.user.id, role: membership.role };
}

export async function GET(request: Request) {
  const storeId = new URL(request.url).searchParams.get("storeId") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(storeId))
    return NextResponse.json({ error: "A valid Store is required." }, { status: 400 });
  const context = await authorize(request, storeId);
  if ("error" in context) return context.error;
  const [inventory, catalog] = await Promise.all([
    context.admin.from("partner_store_inventory")
      .select("id,product_id,store_sku,price,stock_quantity,is_active,updated_at,products!inner(id,name,sku,brand,hsn_code,gst_rate,price)")
      .eq("store_id", storeId).order("updated_at", { ascending: false }),
    context.admin.from("products").select("id,name,sku,brand,price,gst_rate,hsn_code")
      .eq("is_active", true).order("name").limit(300)
  ]);
  if (inventory.error || catalog.error) return NextResponse.json({ error: "Unable to load Store inventory." }, { status: 503 });
  return NextResponse.json({ inventory: inventory.data ?? [], catalog: catalog.data ?? [], role: context.role },
    { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.storeId !== "string" || typeof body.productId !== "string")
    return NextResponse.json({ error: "Store and product are required." }, { status: 400 });
  const context = await authorize(request, body.storeId);
  if ("error" in context) return context.error;
  if (!["owner", "admin"].includes(context.role))
    return NextResponse.json({ error: "Only Store owners and admins can change inventory." }, { status: 403 });
  const price = Number(body.price), stock = Number(body.stockQuantity);
  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0)
    return NextResponse.json({ error: "Enter a valid price and whole-number stock quantity." }, { status: 400 });
  const storeSku = typeof body.storeSku === "string" ? body.storeSku.trim().slice(0, 100) || null : null;
  const { data, error } = await context.admin.from("partner_store_inventory").upsert({
    store_id: body.storeId, product_id: body.productId, store_sku: storeSku,
    price, stock_quantity: stock, is_active: true, created_by: context.userId, updated_at: new Date().toISOString()
  }, { onConflict: "store_id,product_id" }).select("id,product_id,store_sku,price,stock_quantity,is_active,updated_at").single();
  if (error) return NextResponse.json({ error: "Unable to save this Store inventory item. Check that the product exists." }, { status: 400 });
  await context.admin.from("audit_logs").insert({
    actor_user_id: context.userId, action: "partner_store.inventory_upserted",
    entity_type: "partner_store_inventory", entity_id: data.id,
    details: { store_id: body.storeId, product_id: body.productId, price, stock_quantity: stock }
  });
  return NextResponse.json({ item: data });
}
