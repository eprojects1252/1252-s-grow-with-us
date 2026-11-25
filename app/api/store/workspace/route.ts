import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_ECOMMERCE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "Store access is not configured." }, { status: 503 });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return NextResponse.json({ error: "Your session is invalid. Sign in again." }, { status: 401 });
  const { data: memberships, error } = await admin.from("partner_store_members")
    .select("role,is_active,partner_stores!inner(id,store_code,store_name,status,created_at)")
    .eq("user_id", auth.user.id).eq("is_active", true).eq("partner_stores.status", "active");
  if (error) return NextResponse.json({ error: "Unable to load your Store access." }, { status: 503 });
  const stores = (memberships ?? []).flatMap((m: { partner_stores: Array<Record<string, unknown>>; role: string }) => {
    const store = m.partner_stores?.[0];
    return store ? [{ ...store, role: m.role }] : [];
  });
  if (!stores.length) return NextResponse.json({ error: "No active Partner Store is assigned to this account." }, { status: 403 });
  return NextResponse.json({ stores }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
