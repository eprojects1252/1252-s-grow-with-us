import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getApps, initializeApp, type Credential } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { ExternalAccountClient } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/oidc";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getFirebaseAdminAuth() {
  const projectId = process.env.GCP_PROJECT_ID;
  const projectNumber = process.env.GCP_PROJECT_NUMBER;
  const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID;
  const providerId = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID;
  const serviceAccountEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
  if (!projectId || !projectNumber || !poolId || !providerId || !serviceAccountEmail) {
    throw new Error("Firebase server authentication is not configured.");
  }
  const existing = getApps().find(app => app.name === "[DEFAULT]");
  if (existing) return getAuth(existing);
  const audience = `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`;
  const client = ExternalAccountClient.fromJSON({
    type: "external_account", audience,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
    subject_token_supplier: { getSubjectToken: () => getVercelOidcToken() }
  });
  if (!client) throw new Error("Unable to initialize Firebase credentials.");
  const credential = {
    async getAccessToken() {
      const { token } = await client.getAccessToken();
      if (!token) throw new Error("Google Cloud did not return an access token.");
      const expiry = client.credentials.expiry_date;
      return { access_token: token, expires_in: typeof expiry === "number" ? Math.max(1, Math.floor((expiry-Date.now())/1000)) : 3300 };
    }
  } as Credential;
  return getAuth(initializeApp({ credential, projectId }));
}

export async function POST(request: Request) {
  let createdUserId: string | null = null;
  try {
    const body = await request.json();
    const firebaseIdToken = typeof body.firebaseIdToken === "string" ? body.firebaseIdToken : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!firebaseIdToken) return NextResponse.json({ error: "Verify your phone number first." }, { status: 401 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

    const decoded = await getFirebaseAdminAuth().verifyIdToken(firebaseIdToken, true);
    if (!decoded.uid || !decoded.phone_number) return NextResponse.json({ error: "Verified Firebase phone details are missing." }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_ECOMMERCE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: "Account creation is not configured." }, { status: 500 });
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: existingProfile, error: profileError } = await admin.from("profiles")
      .select("id, supabase_user_id, phone_e164").eq("phone_e164", decoded.phone_number).maybeSingle();
    if (profileError) throw profileError;
    if (existingProfile?.supabase_user_id) return NextResponse.json({ error: "Phone number already registered. Please sign in." }, { status: 409 });

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
      email, password: internalPassword, email_confirm: false,
      user_metadata: { phone_e164: decoded.phone_number }
    });
    if (createError) throw createError;
    createdUserId = created.user.id;

    const { error: saveError } = await admin.from("profiles").upsert({
      supabase_user_id: created.user.id,
      phone_e164: decoded.phone_number,
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

    return NextResponse.json({ success: true, requiresEmailConfirmation: true });
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
