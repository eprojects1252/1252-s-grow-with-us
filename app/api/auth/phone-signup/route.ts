import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let createdUserId: string | null = null;
  try {
    const body = await request.json();
    const firebaseIdToken = typeof body.firebaseIdToken === "string" ? body.firebaseIdToken : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    if (!firebaseIdToken) return NextResponse.json({ error: "Verify your phone number first." }, { status: 401 });
    if (!fullName || fullName.length > 120) return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

    const issuerValue = process.env.SRI_AMIRTHAA_ID_ISSUER;
    if (!issuerValue) return NextResponse.json({ error: "Sri Amirthaa ID Core issuer is not configured." }, { status: 503 });
    const identityResponse = await fetch(issuerValue.replace(/\/+$/, "") + "/v1/auth/firebase/session", {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ idToken: firebaseIdToken, pendingEmail: email })
    });
    const identityResult = await identityResponse.json().catch(() => ({}));
    if (!identityResponse.ok) {
      return NextResponse.json({ error: typeof identityResult.error === "string" ? identityResult.error : "Verified phone identity could not be created." }, { status: identityResponse.status });
    }
    const verifiedPhone = identityResult?.user?.phoneNumber;\n    const firebaseUid = identityResult?.user?.firebaseUid;\n    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;\n    if (!firebaseApiKey) return NextResponse.json({ error: "Firebase verification is not configured." }, { status: 503 });\n    const lookupResponse = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(firebaseApiKey), { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ idToken: firebaseIdToken }) });\n    const lookup = await lookupResponse.json().catch(() => ({}));\n    const firebaseUser = Array.isArray(lookup.users) ? lookup.users[0] : null;\n    if (!lookupResponse.ok || !firebaseUser || typeof firebaseUser.email !== "string" || firebaseUser.email.toLowerCase() !== email || typeof firebaseUid !== "string" || firebaseUser.localId !== firebaseUid) return NextResponse.json({ error: "Firebase identity details could not be verified." }, { status: 401 });\n    const emailVerified = firebaseUser.emailVerified === true;
    if (typeof verifiedPhone !== "string" || !/^\+[1-9]\d{7,14}$/.test(verifiedPhone)) {
      return NextResponse.json({ error: "Verified Firebase phone details are missing." }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_ECOMMERCE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: "Account creation is not configured." }, { status: 500 });
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: existingProfile, error: profileError } = await admin.from("profiles")
      .select("id, supabase_user_id, phone_e164, firebase_uid").eq("phone_e164", verifiedPhone).maybeSingle();
    if (profileError) throw profileError;
    if (existingProfile?.supabase_user_id) {\n      if (existingProfile.firebase_uid === firebaseUid) return NextResponse.json({ success: true, alreadyExists: true });\n      return NextResponse.json({ error: "Phone number already registered to another Sri Amirthaa ID." }, { status: 409 });\n    }

    const { data: emailProfile, error: emailProfileError } = await admin.from("profiles")
      .select("id").ilike("email", email).limit(1).maybeSingle();
    if (emailProfileError) throw emailProfileError;
    if (emailProfile) return NextResponse.json({ error: "Email already registered. Please sign in." }, { status: 409 });

    for (let page = 1; ; page += 1) {
      const { data: userPage, error: usersError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (usersError) throw usersError;
      if (userPage.users.some(user => user.email?.trim().toLowerCase() === email)) {
        return NextResponse.json({ error: "Email already registered. Please sign in." }, { status: 409 });
      }
      if (userPage.users.length < 1000) break;
    }

    // Password is never shown to the customer; phone OTP + central OIDC is the login method.
    const internalPassword = randomBytes(48).toString("base64url");
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email, password: internalPassword, email_confirm: emailVerified,
      user_metadata: { phone_e164: verifiedPhone, full_name: fullName }
    });
    if (createError) throw createError;
    createdUserId = created.user.id;

    const { error: saveError } = await admin.from("profiles").upsert({
      supabase_user_id: created.user.id,
      phone_e164: verifiedPhone,
      email
    }, { onConflict: "supabase_user_id" });
    if (saveError) throw saveError;

    const origin = new URL(request.url).origin;
    const { error: emailError } = await admin.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: origin ? `${origin}/auth/callback` : undefined }
    });
    if (emailError) throw emailError;

    return NextResponse.json({ success: true, requiresEmailConfirmation: !emailVerified });
  } catch (error) {
    if (createdUserId) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_ECOMMERCE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (url && key) {
        const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
        await admin.auth.admin.deleteUser(createdUserId).catch(() => undefined);
      }
    }
    console.error("Phone signup failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create your account." }, { status: 500 });
  }
}
