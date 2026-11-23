# Sri Amirthaa ID login setup

The E-Commerce OIDC relying-party implementation is additive. Existing Supabase email/password, Google, Apple, and existing phone login flows remain in place.

## Required E-Commerce environment variable

Set this on the E-Commerce Vercel project (Production and any Preview environment that will be tested):

- \`SRI_AMIRTHAA_ID_ISSUER\`: the public HTTPS origin of the deployed Sri Amirthaa ID Core API, with no trailing slash. Do not use the Core frontend URL.

Existing E-Commerce variables remain required:

- \`NEXT_PUBLIC_SUPABASE_URL\`
- \`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY\`
- \`SUPABASE_SERVICE_ROLE_KEY\`

Never expose the Supabase service-role key or OIDC signing private key in a \`NEXT_PUBLIC_*\` variable.

## Core API environment

Configure on the Sri Amirthaa ID Core Render Web Service:

- \`OIDC_ISSUER\`: exactly the public HTTPS origin of the Core API, matching \`SRI_AMIRTHAA_ID_ISSUER\`.
- \`OIDC_PRIVATE_JWK\`: a stable P-256 EC private JWK with \`kty=EC\`, \`crv=P-256\`, private parameter \`d\`, and a stable \`kid\`. Keep it secret and do not commit it.

The public JWKS endpoint publishes only the public portion of this key. Do not rotate the key without a coordinated rollout.

## Database steps

1. Review and apply Core migration \`0003_oidc_provider.sql\` to the Core Supabase project.
2. Review and apply E-Commerce migration \`20261123000100_link_sri_amirthaa_id.sql\` to the E-Commerce Supabase project.
3. Confirm the Core OAuth client has the exact callback URI:
   \`https://1252-s-grow-with-us.vercel.app/auth/sri-amirthaa/callback\`
4. Confirm the Core OAuth client is active and allows scopes \`openid profile email phone\`.

Do not apply either migration to production until the target Supabase project and migration have been reviewed.

## Login flow

1. Customer selects Continue with Sri Amirthaa ID.
2. Customer verifies their mobile number with Firebase OTP.
3. E-Commerce server sends the Firebase ID token directly to Core; the token is never placed in a URL.
4. Core validates the Firebase token and issues a short-lived, single-use authorization code using PKCE S256.
5. E-Commerce server exchanges the code and validates the ES256 ID token signature, issuer, audience, and nonce.
6. E-Commerce matches the verified phone to an existing profile, binds the immutable Sri Amirthaa ID subject, and uses Supabase's one-time magic-link token flow to establish the existing E-Commerce Supabase session.

New E-Commerce accounts must first be created using the existing signup flow and their email must be confirmed. This integration does not silently merge accounts or create a second profile.

## Current deployment status

This feature is developed on \`feature/sri-amirthaa-id-oidc\`. It is not enabled in production by this change alone. Build checks and runtime configuration must be verified before merging.
