import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type AdminContext = { admin: SupabaseClient; userId: string; role: string };

export async function requireAdmin(request: Request): Promise<AdminContext | NextResponse> {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_ECOMMERCE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "Admin server is not configured." }, { status: 503 });
  if (!token) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) return NextResponse.json({ error: "Your session is invalid. Sign in again." }, { status: 401 });

  const { data: membership, error: membershipError } = await admin.from("admin_members")
    .select("role,is_active").eq("user_id", authData.user.id).maybeSingle();
  if (membershipError) return NextResponse.json({ error: "Unable to verify Admin permissions." }, { status: 503 });
  if (!membership?.is_active) return NextResponse.json({ error: "Admin access has not been approved for this account." }, { status: 403 });

  return { admin, userId: authData.user.id, role: membership.role };
}

export function isAdminContext(value: AdminContext | NextResponse): value is AdminContext {
  return !(value instanceof NextResponse);
}
