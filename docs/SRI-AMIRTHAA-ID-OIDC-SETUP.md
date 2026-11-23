# Sri Amirthaa ID login setup

The E-Commerce integration uses the shared Sri Amirthaa ID phone identity while keeping the E-Commerce Supabase account and session separate. The customer-facing entry is **Continue with Phone**. The internal UUID is never shown as the Sri User ID; the verified phone number is the customer-facing identifier.

## E-Commerce environment variables

Configure these on the E-Commerce Vercel project for every environment that will be used:

- `NEXT_PUBLIC_SUPABASE_ECOMMERCE_URL`: E-Commerce Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ECOMMERCE_PUBLISHABLE_KEY`: E-Commerce Supabase publishable key.
- `SUPABASE_SERVICE_ROLE_KEY`: E-Commerce Supabase service-role key; server-side only.
- `SRI_AMIRTHAA_ID_ISSUER`: `https://nvtfaynhjwycfctsuzxf.supabase.co/functions/v1/sri-amirthaa-id-core` (Core API issuer, not the Core frontend URL).
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase web API key for the Sri Amirthaa ID Core Firebase project.

Keep any existing Core/OIDC-related `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` values unchanged if other application code still uses them. The E-Commerce callback and API routes use the E-Commerce-specific variables above.

Never expose the service-role key or OIDC signing private key in a `NEXT_PUBLIC_*` variable. Do not commit secrets.

## Core API environment

Configure these as Supabase Edge Function secrets on the Core project (project ref `nvtfaynhjwycfctsuzxf`):

- `OIDC_ISSUER`: exactly the public HTTPS Core API issuer, matching `SRI_AMIRTHAA_ID_ISSUER`.
- `OIDC_PRIVATE_JWK`: a stable P-256 EC private JWK with `kty=EC`, `crv=P-256`, private parameter `d`, and a stable `kid`. Keep it secret and do not commit it.

The public JWKS endpoint must publish only the public portion of the signing key. Do not rotate the key without a coordinated rollout.

## Database and OAuth configuration

1. Review Core migration `0003_oidc_provider.sql` for the Core Supabase project.
2. Review E-Commerce migration `20261123000100_link_sri_amirthaa_id.sql` for the E-Commerce Supabase project.
3. Confirm the Core OAuth client ID is `sri-amirthaa-ecommerce`, active, and allows scopes `openid profile email phone`.
4. Confirm the exact registered callback URI is `https://1252-s-grow-with-us.vercel.app/auth/sri-amirthaa/callback`.

Do not apply migrations to a live database until the target project and SQL have been reviewed. The E-Commerce profile migration is additive and links an existing profile to the immutable Core subject; it must not merge accounts based on email alone.

## Customer login flow

1. Customer enters a phone number in the single **Continue with Phone** flow.
2. The app checks whether the phone belongs to an existing E-Commerce account.
3. For a new customer, the app collects and checks email availability, then displays the confirmation details (Sri User ID = phone number, phone, email, and name).
4. The customer verifies the phone using Firebase OTP. New E-Commerce account creation then sends an email confirmation; the customer must confirm that email before the E-Commerce account can be used.
5. For an existing customer, the verified Firebase phone identity is sent server-to-server to Core. Firebase ID tokens are never placed in a URL.
6. Core validates the Firebase token and issues a short-lived, single-use authorization code using PKCE S256.
7. E-Commerce exchanges the code and validates the ES256 ID token signature, issuer, audience, and nonce.
8. E-Commerce links the immutable Core subject to the matching existing profile and establishes the existing E-Commerce Supabase session using a one-time magic-link token.

The integration must not silently merge accounts or create a second profile for an already-linked phone number.

## Validation and release

The GitHub Actions workflow checks dependency installation, lint, TypeScript, and the production build. Runtime OTP delivery, email confirmation, OIDC exchange, and final session creation still require an available Preview deployment and end-to-end testing.

The feature remains on `feature/sri-amirthaa-id-oidc` until explicitly approved. Do not merge the pull request or deploy to Production without approval.
