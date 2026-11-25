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

    const verifiedPhone = identityResult?.user?.phoneNumber;
    const coreSubject = identityResult?.user?.userId;
    const firebaseUid = identityResult?.user?.firebaseUid;
    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!firebaseApiKey) return NextResponse.json({ error: "Firebase verification is not configured." }, { status: 503 });
    const lookupResponse = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(firebaseApiKey), {
      method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
      body: JSON.stringify({ idToken: firebaseIdToken })
    });
    const lookup = await lookupResponse.json().catch(() => ({}));
    const firebaseUser = Array.isArray(lookup.users) ? lookup.users[0] : null;
    if (!lookupResponse.ok || !firebaseUser || typeof firebaseUser.email !== "string" ||
        firebaseUser.email.trim().toLowerCase() !== email || typeof firebaseUid !== "string" ||
        firebaseUser.localId !== firebaseUid || typeof coreSubject !== "string" || !coreSubject) {
      return NextResponse.json({ error: "Firebase or Sri Amirthaa ID identity details could not be verified." }, { status: 401 });
    }
    const emailVerified = firebaseUser.emailVerified === true;
    if (typeof verifiedPhone !== "string" || !/^\+[1-9]\d{7,14}$/.test(verifiedPhone)) {
      return NextResponse.json({ error: "Verified Firebase phone details are missing." }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_ECOMMERCE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: "Account creation is not configured." }, { status: 500 });
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    type ExistingProfile = {
      id: string;
      supabase_user_id: string | null;
      phone_e164: string | null;
      sri_amirthaa_sub: string | null;
      email: string | null;
    };

    const { data: phoneProfile, error: phoneProfileError } = await admin.from("profiles")
      .select("id, supabase_user_id, phone_e164, sri_amirthaa_sub, email")
      .eq("phone_e164", verifiedPhone).maybeSingle();
    if (phoneProfileError) throw phoneProfileError;

    let existingProfile = phoneProfile as ExistingProfile | null;
    if (existingProfile && existingProfile.email?.trim().toLowerCase() !== email) {
      return NextResponse.json({ error: "This verified phone number is already linked to a different E-Commerce email. Sign in to the existing account or contact support." }, { status: 409 });
    }

    if (!existingProfile) {
      const { data: emailProfile, error: emailProfileError } = await admin.from("profiles")
        .select("id, supabase_user_id, phone_e164, sri_amirthaa_sub, email")
        .ilike("email", email).limit(1).maybeSingle();
      if (emailProfileError) throw emailProfileError;
      existingProfile = emailProfile as ExistingProfile | null;
      if (existingProfile?.phone_e164 && existingProfile.phone_e164 !== verifiedPhone) {
        return NextResponse.json({ error: "This email is already linked to another phone number. Please sign in to your existing account." }, { status: 409 });
      }
    }

    if (existingProfile?.sri_amirthaa_sub && existingProfile.sri_amirthaa_sub !== coreSubject) {
      return NextResponse.json({ error: "This E-Commerce account is already linked to another Sri Amirthaa ID." }, { status: 409 });
    }

    // Reuse the existing E-Commerce auth account when the verified phone/email
    // already identifies its profile. Do not create a duplicate user.
    if (existingProfile?.supabase_user_id) {
      const { data: existingAuth, error: existingAuthError } = await admin.auth.admin.getUserById(existingProfile.supabase_user_id);
      if (existingAuthError || !existingAuth.user || existingAuth.user.email?.trim().toLowerCase() !== email) {
        return NextResponse.json({ error: "The existing E-Commerce account could not be safely matched. Please contact support." }, { status: 409 });
      }
      const { error: linkError } = await admin.from("profiles").update({
        sri_amirthaa_sub: coreSubject,
        phone_e164: verifiedPhone,
        email,
        full_name: fullName
      }).eq("id", existingProfile.id);
      if (linkError) throw linkError;
      return NextResponse.json({ success: true, alreadyExists: true, requiresEmailConfirmation: !existingAuth.user.email_confirmed_at });
    }

    // If a matching profile exists without an Auth foreign key, reuse a
    // previously verified Supabase Auth user for that same email if present.
    let authUserId: string | null = null;
    for (let page = 1; ; page += 1) {
      const { data: userPage, error: usersError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (usersError) throw usersError;
      const matchingUser = userPage.users.find(user => user.email?.trim().toLowerCase() === email);
      if (matchingUser) {
        if (!existingProfile || !matchingUser.email_confirmed_at) {
          return NextResponse.json({ error: "Email already belongs to an E-Commerce account. Please sign in with that account." }, { status: 409 });
        }
        authUserId = matchingUser.id;
        break;
      }
      if (userPage.users.length < 1000) break;
    }

    if (!authUserId) {
      const internalPassword = randomBytes(48).toString("base64url");
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email, password: internalPassword, email_confirm: emailVerified,
        user_metadata: { phone_e164: verifiedPhone, full_name: fullName }
      });
      if (createError) throw createError;
      createdUserId = created.user.id;
      authUserId = created.user.id;
    }

    const profileValues = {
      supabase_user_id: authUserId,
      sri_amirthaa_sub: coreSubject,
      phone_e164: verifiedPhone,
      email,
      full_name: fullName
    };
    const saveResult = existingProfile
      ? await admin.from("profiles").update(profileValues).eq("id", existingProfile.id)
      : await admin.from("profiles").upsert(profileValues, { onConflict: "supabase_user_id" });
    if (saveResult.error) throw saveResult.error;

    if (!emailVerified && createdUserId) {
      const origin = new URL(request.url).origin;
      const { error: emailError } = await admin.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: origin + "/auth/callback" }
      });
      if (emailError) throw emailError;
    }

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
