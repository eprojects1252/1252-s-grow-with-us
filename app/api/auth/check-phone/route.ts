import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const normalized = rawPhone.replace(/[\s()-]/g, "");
    const phone = normalized.startsWith("+") ? normalized : \`+\${normalized}\`;
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      return NextResponse.json({ error: "Enter a valid phone number with country code." }, { status: 400 });
    }

    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !publishableKey) {
      return NextResponse.json({ error: "Sri Amirthaa ID Core is not configured for this deployment." }, { status: 503 });
    }

    const response = await fetch(\`\${supabaseUrl}/functions/v1/check-contact\`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", apikey: publishableKey },
      body: JSON.stringify({ type: "phone", value: phone })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || typeof result.available !== "boolean") {
      console.error("Core phone lookup failed:", response.status, result?.error);
      return NextResponse.json({ error: "Unable to check your Sri Amirthaa ID right now. Please try again." }, { status: 503 });
    }
    return NextResponse.json({ registered: !result.available });
  } catch (error) {
    console.error("Phone availability check failed:", error);
    return NextResponse.json({ error: "Unable to check this phone number right now." }, { status: 500 });
  }
}
