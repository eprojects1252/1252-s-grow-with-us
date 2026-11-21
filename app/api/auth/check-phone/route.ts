import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const normalized = rawPhone.replace(/[\\s()-]/g, "");
    const e164 = normalized.startsWith("+") ? normalized : `+${normalized}`;
    if (!/^\\+[1-9]\\d{7,14}$/.test(e164)) {
      return NextResponse.json({ error: "Enter a valid phone number with country code." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      return NextResponse.json({ error: "Phone account lookup is not configured." }, { status: 500 });
    }
    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: profile, error } = await admin
      .from("profiles")
      .select("email, supabase_user_id")
      .eq("phone_e164", e164)
      .maybeSingle();
    if (error) throw error;

    const registered = Boolean(profile?.supabase_user_id);
    return NextResponse.json({
      registered,
      email: profile?.email ?? null,
      canPasswordLogin: registered && Boolean(profile?.email)
    });
  } catch (error) {
    console.error("Phone availability check failed:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unable to check this phone number right now."
    }, { status: 500 });
  }
}
