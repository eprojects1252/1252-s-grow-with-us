import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_ECOMMERCE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Account access verification is not configured." }, { status: 503 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Your session is invalid. Please sign in again." }, { status: 401 });
  }

  const { data: membership, error } = await admin
    .from("admin_members")
    .select("role,is_active")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Unable to verify account permissions. Please try again." }, { status: 503 });
  }

  // A membership row marks this identity as an Admin account. Never silently
  // downgrade an inactive Admin to a customer session.
  if (membership && !membership.is_active) {
    return NextResponse.json({ error: "Admin access is currently inactive. Contact the account owner." }, { status: 403 });
  }

  if (membership?.is_active) {
    return NextResponse.json({ destination: "/admin", role: membership.role }, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });
  }

  return NextResponse.json({ destination: "/account", role: "customer" }, {
    headers: { "Cache-Control": "no-store, max-age=0" }
  });
}
