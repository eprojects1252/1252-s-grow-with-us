import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const CLIENT_ID = "sri-amirthaa-ecommerce";
const REDIRECT_URI = "https://1252-s-grow-with-us.vercel.app/auth/sri-amirthaa/callback";
const COOKIE_PATH = "/api/auth/sri-amirthaa";

function randomValue() {
  return randomBytes(32).toString("base64url");
}

export async function POST(request: Request) {
  try {
    const requestOrigin = new URL(request.url).origin;
    const origin = request.headers.get("origin");
    if (origin && origin !== requestOrigin) {
      return NextResponse.json({ error: "Cross-site login request rejected." }, { status: 403 });
    }

    const issuerValue = process.env.SRI_AMIRTHAA_ID_ISSUER;
    if (!issuerValue) {
      return NextResponse.json({ error: "Sri Amirthaa ID Core issuer is not configured on this deployment." }, { status: 503 });
    }
    const issuer = issuerValue.replace(/\/+$/, "");
    const issuerUrl = new URL(issuer);
    if (issuerUrl.protocol !== "https:" && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Sri Amirthaa ID issuer must use HTTPS." }, { status: 500 });
    }

    const body = await request.json();
    const firebaseIdToken = typeof body.firebaseIdToken === "string" ? body.firebaseIdToken : "";
    if (firebaseIdToken.length < 100 || firebaseIdToken.length > 10000) {
      return NextResponse.json({ error: "Complete phone verification before continuing." }, { status: 401 });
    }

    const state = randomValue();
    const nonce = randomValue();
    const verifier = randomValue();
    const challenge = createHash("sha256").update(verifier).digest("base64url");

    // Sync the verified Firebase identity into the central account registry first.
    // This lets a customer authenticate from a participating site without first visiting the ID portal.
    const identitySync = await fetch(issuer + "/v1/auth/firebase/session", {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ idToken: firebaseIdToken })
    });
    if (!identitySync.ok) {
      const syncResult = await identitySync.json().catch(() => ({}));
      const reason = typeof syncResult.error === "string" ? syncResult.error : "IDENTITY_SYNC_FAILED";
      return NextResponse.json({ error: "Sri Amirthaa ID account verification failed (" + reason + ")." }, {
        status: identitySync.status >= 400 && identitySync.status < 600 ? identitySync.status : 502
      });
    }

    const authorization = await fetch(issuer + "/oauth/authorize", {
      method: "POST",
      redirect: "manual",
      cache: "no-store",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: "openid profile email phone",
        state,
        nonce,
        code_challenge: challenge,
        code_challenge_method: "S256",
        idToken: firebaseIdToken
      })
    });

    if (authorization.status !== 302) {
      const result = await authorization.json().catch(() => ({}));
      return NextResponse.json(
        { error: typeof result.error === "string" ? result.error : "Sri Amirthaa ID authorization could not be started." },
        { status: authorization.status >= 400 && authorization.status < 600 ? authorization.status : 502 }
      );
    }

    const location = authorization.headers.get("location");
    if (!location) return NextResponse.json({ error: "Identity provider did not return an authorization redirect." }, { status: 502 });
    const redirect = new URL(location);
    if (redirect.origin !== issuerUrl.origin || redirect.pathname !== new URL(REDIRECT_URI).pathname) {
      return NextResponse.json({ error: "Identity provider returned an unexpected redirect." }, { status: 502 });
    }

    const jar = await cookies();
    const secure = process.env.NODE_ENV === "production";
    const options = { httpOnly: true, secure, sameSite: "lax" as const, path: COOKIE_PATH, maxAge: 300 };
    jar.set("sa_oidc_state", state, options);
    jar.set("sa_oidc_nonce", nonce, options);
    jar.set("sa_oidc_verifier", verifier, options);

    return NextResponse.json({ authorizationUrl: redirect.toString() }, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });
  } catch (error) {
    console.error("Sri Amirthaa ID login initiation failed:", error);
    return NextResponse.json({ error: "Unable to start Sri Amirthaa ID login. Please try again." }, { status: 500 });
  }
}
