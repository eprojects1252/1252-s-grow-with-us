import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "E-Commerce database connection is not configured." }, { status: 503 });
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "Cache-Control": "no-store" } },
  });

  const [{ data: categories, error: categoryError }, { data: products, error: productError }] = await Promise.all([
    supabase.from("categories").select("id,parent_id,name,slug,icon,sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("products")
      .select("id,category_id,sku,name,short_description,price,compare_at_price,is_featured,stock_status,product_images(image_url,alt_text,is_primary,sort_order)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (categoryError || productError) {
    console.error("Storefront catalog query failed:", categoryError ?? productError);
    return NextResponse.json({ error: "Unable to load the store catalog." }, { status: 503 });
  }

  const categoryNames = new Map((categories ?? []).map((category: { id: string; name: string }) => [category.id, category.name]));
  const productRows = (products ?? []) as Array<{ id: string; category_id: string | null; product_images?: Array<{ image_url: string | null; alt_text: string | null; is_primary: boolean; sort_order: number }> | null; [key: string]: unknown }>;
  return NextResponse.json({
    categories: categories ?? [],
    products: productRows.map((product) => {
      const images = [...(product.product_images ?? [])].sort((a, b) =>
        Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) || a.sort_order - b.sort_order
      );
      return {
        ...product,
        category_name: product.category_id ? categoryNames.get(product.category_id) ?? "" : "",
        image_url: images[0]?.image_url ?? null,
      };
    }),
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
