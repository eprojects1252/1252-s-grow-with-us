import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Email availability check is not configured." }, { status: 500 });
    }
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: profile, error: profileError } = await admin
      .from("profiles").select("id").ilike("email", email).limit(1).maybeSingle();
    if (profileError) throw profileError;

    let alreadyRegistered = Boolean(profile);
    for (let page = 1; !alreadyRegistered; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      const users = data.users ?? [];
      alreadyRegistered = users.some(user => user.email?.trim().toLowerCase() === email);
      if (alreadyRegistered || users.length < 1000) break;
    }

    if (alreadyRegistered) {
      return NextResponse.json({
        available: false,
        message: "Email already registered. Please sign in with that email account."
      });
    }
    return NextResponse.json({ available: true, message: "This email is available." });
  } catch (error) {
    console.error("Email availability check failed:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unable to check this email right now."
    }, { status: 500 });
  }
}
