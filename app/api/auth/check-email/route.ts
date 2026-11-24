import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !publishableKey) {
      return NextResponse.json({ error: "Sri Amirthaa ID Core is not configured for this deployment." }, { status: 503 });
    }

    const response = await fetch(supabaseUrl + "/functions/v1/check-contact", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", apikey: publishableKey },
      body: JSON.stringify({ type: "email", value: email })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || typeof result.available !== "boolean") {
      console.error("Core email lookup failed:", response.status, result?.error);
      return NextResponse.json({ error: "Unable to check this Sri Amirthaa ID email right now. Please try again." }, { status: 503 });
    }

    return NextResponse.json({
      available: result.available,
      message: result.available ? "This email is available." : "Email already registered. Please sign in with your existing Sri Amirthaa ID."
    });
  } catch (error) {
    console.error("Email availability check failed:", error);
    return NextResponse.json({ error: "Unable to check this email right now." }, { status: 500 });
  }
}
