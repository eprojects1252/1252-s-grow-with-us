import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const normalized = rawPhone.replace(/[\\s()-]/g, "");
    const phone = normalized.startsWith("+") ? normalized : `+${normalized}`;
    if (!/^\\+[1-9]\\d{7,14}$/.test(phone)) {
      return NextResponse.json({ error: "Enter a valid phone number with country code." }, { status: 400 });
    }

    const issuer = process.env.SRI_AMIRTHAA_ID_ISSUER?.replace(/\\/+$/, "");
    if (!issuer) {
      return NextResponse.json({ error: "Sri Amirthaa ID Core is not configured for this deployment." }, { status: 503 });
    }

    // The Core identity registry is the source of truth. E-Commerce profiles
    // are app-specific and may not exist yet for a valid central Sri User ID.
    const response = await fetch(`${issuer}/v1/auth/check-contact`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ type: "phone", value: phone })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || typeof result.available !== "boolean") {
      console.error("Core phone lookup failed:", response.status, result?.error);
      return NextResponse.json({ error: "Unable to check your Sri Amirthaa ID right now. Please try again." }, { status: response.status >= 400 && response.status < 500 ? response.status : 503 });
    }

    return NextResponse.json({ registered: !result.available });
  } catch (error) {
    console.error("Phone availability check failed:", error);
    return NextResponse.json({ error: "Unable to check this phone number right now." }, { status: 500 });
  }
}
