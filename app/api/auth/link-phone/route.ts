import { NextResponse } from "next/server";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getFirebaseAdminAuth() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured.");
  const serviceAccount = JSON.parse(serviceAccountJson);
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert(serviceAccount) });
  return getAuth(app);
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!accessToken) return NextResponse.json({ error: "A signed-in Supabase session is required." }, { status: 401 });

    const body = await request.json();
    const firebaseIdToken = typeof body.firebaseIdToken === "string" ? body.firebaseIdToken : "";
    if (!firebaseIdToken) return NextResponse.json({ error: "Firebase ID token is required." }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
      return NextResponse.json({ error: "Supabase server environment is incomplete." }, { status: 500 });
    }

    const userClient = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);
    if (userError || !userData.user) return NextResponse.json({ error: "Supabase session is invalid or expired." }, { status: 401 });

    const decoded = await getFirebaseAdminAuth().verifyIdToken(firebaseIdToken, true);
    if (!decoded.uid || !decoded.phone_number) {
      return NextResponse.json({ error: "Firebase token must contain a verified phone number." }, { status: 400 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: existing, error: lookupError } = await admin
      .from("profiles")
      .select("id, supabase_user_id, firebase_uid, phone_e164")
      .or(`firebase_uid.eq.${decoded.uid},phone_e164.eq.${decoded.phone_number}`);

    if (lookupError) throw lookupError;
    const conflict = (existing || []).find(row => row.supabase_user_id !== userData.user.id);
    if (conflict) {
      return NextResponse.json({ error: "This Firebase account or phone number is already linked to another profile. No accounts were merged." }, { status: 409 });
    }

    const { error: updateError } = await admin
      .from("profiles")
      .upsert({
        supabase_user_id: userData.user.id,
        firebase_uid: decoded.uid,
        phone_e164: decoded.phone_number,
        email: userData.user.email ?? null,
        full_name: (userData.user.user_metadata?.full_name as string | undefined) ?? (userData.user.user_metadata?.name as string | undefined) ?? null
      }, { onConflict: "supabase_user_id" });

    if (updateError) throw updateError;
    return NextResponse.json({ success: true, phone: decoded.phone_number });
  } catch (error) {
    console.error("Phone account linking failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Phone account linking failed." }, { status: 500 });
  }
}
