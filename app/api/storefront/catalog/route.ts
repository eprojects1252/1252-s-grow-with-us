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
      .select("id,category_id,sku,name,short_description,price,compare_at_price,is_featured,stock_status,product_images(image_url,alt_text,is_primary,sort_order),categories(name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (categoryError || productError) {
    console.error("Storefront catalog query failed:", categoryError ?? productError);
    return NextResponse.json({ error: "Unable to load the store catalog." }, { status: 503 });
  }

  return NextResponse.json({
    categories: categories ?? [],
    products: (products ?? []).map((product) => {
      const images = [...(product.product_images ?? [])].sort((a, b) =>
        Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) || a.sort_order - b.sort_order
      );
      return {
        ...product,
        category_name: Array.isArray(product.categories) ? product.categories[0]?.name ?? "" : product.categories?.name ?? "",
        image_url: images[0]?.image_url ?? null,
      };
    }),
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
