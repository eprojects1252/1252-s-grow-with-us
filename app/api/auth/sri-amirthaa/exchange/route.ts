import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createRemoteJWKSet, jwtVerify } from "jose";

export const runtime = "nodejs";

const CLIENT_ID = "sri-amirthaa-ecommerce";
const COOKIE_PATH = "/api/auth/sri-amirthaa";

export async function POST(request: Request) {
  const redirectUri = `${new URL(request.url).origin}/auth/sri-amirthaa/callback`;
  const jar = await cookies();
  const stateCookie = jar.get("sa_oidc_state")?.value ?? "";
  const nonceCookie = jar.get("sa_oidc_nonce")?.value ?? "";
  const verifier = jar.get("sa_oidc_verifier")?.value ?? "";
  const secure = process.env.NODE_ENV === "production";
  const clear = { httpOnly: true, secure, sameSite: "lax" as const, path: COOKIE_PATH, maxAge: 0 };
  try {
    const body = await request.json();
    const code = typeof body.code === "string" ? body.code : "";
    const state = typeof body.state === "string" ? body.state : "";
    if (!code || !state || !stateCookie || state !== stateCookie || !nonceCookie || !verifier) {
      return NextResponse.json({ error: "Login state is invalid or expired. Please start again." }, { status: 400 });
    }

    const issuerValue = process.env.SRI_AMIRTHAA_ID_ISSUER;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_ECOMMERCE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ECOMMERCE_PUBLISHABLE_KEY;
    if (!issuerValue || !supabaseUrl || !serviceKey || !publishableKey) {
      return NextResponse.json({ error: "Sri Amirthaa ID or E-Commerce authentication is not configured." }, { status: 503 });
    }
    const issuer = issuerValue.replace(/\/+$/, "");
    const tokenResponse = await fetch(issuer + "/oauth/token", {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        client_id: CLIENT_ID,
        redirect_uri: redirectUri,
        code_verifier: verifier
      })
    });
    const tokens = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || typeof tokens.id_token !== "string") {
      return NextResponse.json({ error: "Sri Amirthaa ID could not complete token verification. Please sign in again." }, { status: 401 });
    }

    const jwks = createRemoteJWKSet(new URL(issuer + "/.well-known/jwks.json"));
    const verified = await jwtVerify(tokens.id_token, jwks, {
      issuer,
      audience: CLIENT_ID,
      algorithms: ["ES256"]
    });
    const claims = verified.payload;
    if (claims.nonce !== nonceCookie || typeof claims.sub !== "string" ||
        claims.phone_number_verified !== true || typeof claims.phone_number !== "string") {
      return NextResponse.json({ error: "Sri Amirthaa ID verification details are incomplete." }, { status: 401 });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: bySubject, error: subjectError } = await admin.from("profiles")
      .select("id, supabase_user_id, phone_e164, email, sri_amirthaa_sub")
      .eq("sri_amirthaa_sub", claims.sub).maybeSingle();
    if (subjectError) throw subjectError;

    let profile = bySubject;
    if (!profile) {
      const { data: byPhone, error: phoneError } = await admin.from("profiles")
        .select("id, supabase_user_id, phone_e164, email, sri_amirthaa_sub")
        .eq("phone_e164", claims.phone_number).maybeSingle();
      if (phoneError) throw phoneError;
      profile = byPhone;
    }

    if (!profile || !profile.supabase_user_id) {
      return NextResponse.json({
        error: "No E-Commerce account is linked to this verified Sri Amirthaa ID phone number. Create your E-Commerce account first."
      }, { status: 403 });
    }
    if (profile.phone_e164 !== claims.phone_number) {
      return NextResponse.json({ error: "The verified phone number does not match the linked E-Commerce account." }, { status: 403 });
    }
    if (profile.sri_amirthaa_sub && profile.sri_amirthaa_sub !== claims.sub) {
      return NextResponse.json({ error: "This E-Commerce account is linked to another Sri Amirthaa ID. Contact support." }, { status: 409 });
    }

    if (!profile.sri_amirthaa_sub) {
      const { error: linkError } = await admin.from("profiles")
        .update({ sri_amirthaa_sub: claims.sub }).eq("id", profile.id);
      if (linkError) throw linkError;
    }

    const { data: userResult, error: userError } = await admin.auth.admin.getUserById(profile.supabase_user_id);
    if (userError || !userResult.user?.email || !userResult.user.email_confirmed_at) {
      return NextResponse.json({
        error: "Your E-Commerce email must be confirmed before Sri Amirthaa ID can create a secure session."
      }, { status: 403 });
    }

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: userResult.user.email,
      options: { redirectTo: redirectUri }
    });
    if (linkError) throw linkError;
    const tokenHash = link.properties?.hashed_token;
    if (!tokenHash) throw new Error("Supabase did not return a one-time sign-in token.");

    const response = NextResponse.json({ tokenHash }, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });
    response.cookies.set("sa_oidc_state", "", clear);
    response.cookies.set("sa_oidc_nonce", "", clear);
    response.cookies.set("sa_oidc_verifier", "", clear);
    return response;
  } catch (error) {
    console.error("Sri Amirthaa ID callback exchange failed:", error);
    const response = NextResponse.json({ error: "Sri Amirthaa ID sign-in failed. Please try again." }, { status: 500 });
    response.cookies.set("sa_oidc_state", "", clear);
    response.cookies.set("sa_oidc_nonce", "", clear);
    response.cookies.set("sa_oidc_verifier", "", clear);
    return response;
  }
}
