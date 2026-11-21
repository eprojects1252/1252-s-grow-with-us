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
    type: "external_account",
    audience,
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
      return {
        access_token: token,
        expires_in: typeof expiry === "number" ? Math.max(1, Math.floor((expiry - Date.now()) / 1000)) : 3300
      };
    }
  } as Credential;
  return getAuth(initializeApp({ credential, projectId }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const phone = rawPhone.replace(/[\\s()-]/g, "");
    const e164 = phone.startsWith("+") ? phone : `+${phone}`;
    if (!/^\\+[1-9]\\d{7,14}$/.test(e164)) {
      return NextResponse.json({ error: "Enter a valid phone number with country code." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Phone account lookup is not configured." }, { status: 500 });
    }
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("email, supabase_user_id, phone_e164")
      .eq("phone_e164", e164)
      .maybeSingle();
    if (profileError) throw profileError;

    let firebaseRegistered = false;
    try {
      await getFirebaseAdminAuth().getUserByPhoneNumber(e164);
      firebaseRegistered = true;
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code !== "auth/user-not-found") throw error;
    }

    const registered = Boolean(profile?.supabase_user_id || firebaseRegistered);
    return NextResponse.json({
      registered,
      email: profile?.email ?? null,
      canPasswordLogin: Boolean(profile?.supabase_user_id && profile?.email)
    });
  } catch (error) {
    console.error("Phone availability check failed:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unable to check this phone number right now."
    }, { status: 500 });
  }
}
