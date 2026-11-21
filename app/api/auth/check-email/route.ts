import { NextResponse } from "next/server";
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
  try {
    const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/, "");
    if (!token) return NextResponse.json({ error: "Phone sign-in is required." }, { status: 401 });
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token, true);
    if (!decoded.phone_number) return NextResponse.json({ error: "Verify your mobile number before checking an email." }, { status: 403 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: "Email availability check is not configured." }, { status: 500 });
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await admin.from("profiles").select("firebase_uid,supabase_user_id").ilike("email", email).limit(1);
    if (error) throw error;
    let alreadyRegistered = Boolean(data?.length);
    // Also check Supabase Auth directly so accounts created after the profile backfill are detected.
    for (let page = 1; !alreadyRegistered; page += 1) {
      const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (usersError) throw usersError;
      const users = usersPage.users ?? [];
      alreadyRegistered = users.some(user => user.email?.trim().toLowerCase() === email);
      if (alreadyRegistered || users.length < 1000) break;
    }
    if (alreadyRegistered) return NextResponse.json({ available: false, message: "Email already registered. Please sign in with that email account." });
    return NextResponse.json({ available: true, message: "This email is available." });
  } catch (error) {
    console.error("Email availability check failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to check this email right now." }, { status: 500 });
  }
}
