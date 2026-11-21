import { NextResponse } from "next/server";
import { cert, getApps, initializeApp, type Credential } from "firebase-admin/app";
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
    throw new Error("Missing Google Cloud Workload Identity environment variables.");
  }

  const existingApp = getApps().find((app) => app.name === "[DEFAULT]");
  if (existingApp) return getAuth(existingApp);

  const audience = `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`;
  const externalAccountClient = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
    subject_token_supplier: {
      getSubjectToken: () => getVercelOidcToken(),
    },
  });

  if (!externalAccountClient) {
    throw new Error("Unable to initialize Google Cloud Workload Identity credentials.");
  }

  const credential = {
    async getAccessToken() {
      const { token } = await externalAccountClient.getAccessToken();
      if (!token) throw new Error("Google Cloud did not return an access token.");
      const expiryDate = externalAccountClient.credentials.expiry_date;
      return {
        access_token: token,
        expires_in: typeof expiryDate === "number"
          ? Math.max(1, Math.floor((expiryDate - Date.now()) / 1000))
          : 3300,
      };
    },
  } as Credential;

  const app = initializeApp({ credential, projectId });
  return getAuth(app);
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!accessToken) return NextResponse.json({ error: "Sign in to your existing account before linking a phone." }, { status: 401 });

    const body = await request.json();
    const firebaseIdToken = typeof body.firebaseIdToken === "string" ? body.firebaseIdToken : "";
    if (!firebaseIdToken) return NextResponse.json({ error: "Firebase ID token is required." }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing Supabase server environment variables." }, { status: 500 });
    }

    const userClient = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);
    if (userError || !userData.user) return NextResponse.json({ error: "Supabase session is invalid or expired." }, { status: 401 });

    const decoded = await getFirebaseAdminAuth().verifyIdToken(firebaseIdToken, true);
    if (!decoded.uid || !decoded.phone_number) {
      return NextResponse.json({ error: "Firebase token does not contain a verified phone number." }, { status: 400 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: currentProfile, error: currentError } = await admin
      .from("profiles")
      .select("id, firebase_uid, phone_e164")
      .eq("supabase_user_id", userData.user.id)
      .maybeSingle();
    if (currentError) throw currentError;

    if (currentProfile?.firebase_uid && currentProfile.firebase_uid !== decoded.uid) {
      return NextResponse.json({ error: "This account already has a different Firebase identity linked. Contact support before changing it." }, { status: 409 });
    }
    if (currentProfile?.phone_e164 && currentProfile.phone_e164 !== decoded.phone_number) {
      return NextResponse.json({ error: "A different phone number is already linked to this account. Contact support before changing it." }, { status: 409 });
    }

    const { data: uidOwner, error: uidError } = await admin
      .from("profiles").select("supabase_user_id").eq("firebase_uid", decoded.uid).maybeSingle();
    if (uidError) throw uidError;
    const { data: phoneOwner, error: phoneError } = await admin
      .from("profiles").select("supabase_user_id").eq("phone_e164", decoded.phone_number).maybeSingle();
    if (phoneError) throw phoneError;

    if ((uidOwner && uidOwner.supabase_user_id !== userData.user.id) ||
        (phoneOwner && phoneOwner.supabase_user_id !== userData.user.id)) {
      return NextResponse.json({ error: "This Firebase identity or phone number is already linked to another profile. No accounts were merged." }, { status: 409 });
    }

    const { error: saveError } = await admin.from("profiles").upsert({
      supabase_user_id: userData.user.id,
      firebase_uid: decoded.uid,
      phone_e164: decoded.phone_number,
      email: userData.user.email ?? null,
      full_name: (userData.user.user_metadata?.full_name as string | undefined)
        ?? (userData.user.user_metadata?.name as string | undefined)
        ?? null
    }, { onConflict: "supabase_user_id" });
    if (saveError) throw saveError;

    return NextResponse.json({ success: true, phone: decoded.phone_number });
  } catch (error) {
    console.error("Phone account linking failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Phone account linking failed." }, { status: 500 });
  }
}
