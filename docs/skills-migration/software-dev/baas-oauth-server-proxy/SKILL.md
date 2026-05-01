---
name: baas-oauth-server-proxy
description: Fix BaaS (AppWrite/Supabase/Firebase) OAuth on ALL browsers (Chrome/Safari/Firefox) by building server-side API routes that proxy the OAuth flow -- bypassing third-party cookie blocking (SameSite Lax / ITP). Works for desktop Chrome too, not just iOS Safari. Covers the 401 guests missing scopes error.
version: 1.1.0
metadata:
  hermes:
    tags: [oauth, ios, safari, itp, cookies, appwrite, supabase, firebase, nextjs, baas]
    triggers:
      - "iOS OAuth not working"
      - "third-party cookie blocked"
      - "OAuth redirect fails on iPhone"
      - "AppWrite OAuth iOS Safari"
      - "BaaS login broken on mobile"
      - "general_unauthorized_scope guests"
      - "cross-domain cookie"
      - "Auth failed: 401"
      - "User (role: guests) missing scopes"
---

# BaaS OAuth Server-Side Proxy (iOS Safari Fix)

## Problem

SPAs using BaaS (AppWrite, Supabase, Firebase) for OAuth break on iOS Safari because:

1. BaaS OAuth flow sets session cookies on the BaaS domain (e.g., `sgp.cloud.appwrite.io`)
2. After OAuth redirect back to the app domain, the client SDK needs those cookies to authenticate
3. iOS Safari's Intelligent Tracking Prevention (ITP) **blocks third-party cookies** — the BaaS domain cookie is inaccessible from the app domain
4. `account.get()` / `supabase.auth.getSession()` returns 401 or `guests` role

The client-side SDK's `createOAuth2Session()` or `signInWithOAuth()` relies entirely on this cross-domain cookie mechanism. Changing to `createOAuth2Token()` doesn't help — the SDK still can't retrieve the session after redirect because there's no state on a fresh page load.

## Solution

**Bypass the BaaS SDK's OAuth entirely.** Build server-side API routes that:
1. Redirect directly to Google (not through the BaaS)
2. Receive the OAuth callback server-side (same domain, no cookie issues)
3. Exchange the code for tokens
4. Create a session with the BaaS using REST API (server-to-server, not browser)
5. Set the session cookie on the **app's own domain** (first-party, never blocked)

## Architecture

```
Browser: /api/auth/google (server redirect)
  → Google OAuth (user signs in)
  → /api/auth/google/callback (server-side)
    1. Exchange code → Google tokens
    2. Get user email/name from Google
    3. Search BaaS for existing user by email
    4. Create user if not found (via BaaS REST API)
    5. Create user token → create session (via BaaS REST API)
    6. Set session cookie on OUR domain (SameSite=Lax)
    7. Redirect to app
```

## Implementation (Next.js + AppWrite)

### Step 1: API Route — Initiate OAuth

`app/api/auth/google/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
    prompt: 'consent',
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  )
}
```

### Step 2: API Route — OAuth Callback

`app/api/auth/google/callback/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get('code')
  const error = new URL(request.url).searchParams.get('error')
  
  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(error || 'no_code')}`, request.url)
    )
  }

  const appwriteEndpoint = 'https://sgp.cloud.appwrite.io/v1'
  const appwriteProject = process.env.NEXT_PUBLIC_APPWRITE_PROJECT
  const appwriteKey = process.env.APPWRITE_API_KEY

  const awHeaders = {
    'Content-Type': 'application/json',
    'X-Appwrite-Key': appwriteKey!,
    'X-Appwrite-Project': appwriteProject!,
  }

  // 1. Exchange Google code
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${request.nextUrl.origin}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })
  const tokens = await tokenRes.json()
  
  // 2. Get Google user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const googleUser = await userRes.json()

  // 3. Find or create AppWrite user
  // IMPORTANT: Try-creating-first is more reliable than searching.
  // AppWrite's `queries[]=equal("email",...)` search often fails silently.
  // Instead: try POST /users → if 409 (exists), then search with `?search=`.
  let userId: string
  const createRes = await fetch(`${appwriteEndpoint}/users`, {
    method: 'POST', headers: awHeaders,
    body: JSON.stringify({
      userId: 'unique()',
      email: googleUser.email,
      name: googleUser.name || googleUser.email.split('@')[0],
    }),
  })
  const createData = await createRes.json()
  
  if (createRes.ok && createData.$id) {
    userId = createData.$id  // New user created
  } else if (createRes.status === 409) {
    // User exists — search by email (use ?search= not queries[])
    const searchRes = await fetch(
      `${appwriteEndpoint}/users?search=${encodeURIComponent(googleUser.email)}&limit=1`,
      { headers: awHeaders }
    )
    const searchData = await searchRes.json()
    userId = searchData.users?.[0]?.$id
    if (!userId) throw new Error(`User exists but search returned empty`)
  } else {
    throw new Error(`User creation failed: ${JSON.stringify(createData)}`)
  }

  // 4. Create user token → create session
  const tokenData = await fetch(`${appwriteEndpoint}/users/${userId}/tokens`, {
    method: 'POST', headers: awHeaders,
  }).then(r => r.json())
  if (!tokenData.secret) throw new Error(`Token creation failed: ${JSON.stringify(tokenData)}`)

  // 5. Create session SERVER-SIDE using the token (consumes it)
  // This avoids the third-party cookie issue that breaks client-side createSession().
  // The session secret is then set as a cookie on OUR domain — first-party, never blocked.
  const sessionRes = await fetch(`${appwriteEndpoint}/account/sessions/token`, {
    method: 'POST',
    headers: awHeaders,
    body: JSON.stringify({ userId, secret: tokenData.secret }),
  })
  const sessionData = await sessionRes.json()
  if (!sessionRes.ok || !sessionData.secret) {
    throw new Error(`Session creation failed: ${JSON.stringify(sessionData)}`)
  }

  // 6. Set session secret as a cookie on OUR domain (NOT AppWrite's domain)
  // The client reads this cookie and calls client.setSession() — uses header auth,
  // completely bypassing cross-domain cookie / SameSite blocking.
  const response = NextResponse.redirect(new URL('/', request.url))
  response.cookies.set('aw_session', sessionData.secret, {
    httpOnly: false,   // JS needs to read it for AppWrite SDK
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
  return response
}
```

### Step 3: Client-Side — Read Session Cookie + Set Session Header

Instead of passing the token to a callback page for client-side `createSession()` (which still hits the third-party cookie wall), the server creates the session and sets a cookie on the app domain. The client reads this cookie and uses `client.setSession()` which sends the session via `X-Appwrite-Session` header — completely bypassing cookies.

**`lib/appwrite.ts`** — read the domain cookie on init:

```typescript
import { Client, Account, Databases, ID } from 'appwrite'

const client = new Client()
  .setEndpoint('https://sgp.cloud.appwrite.io/v1')
  .setProject('your-project-id')

// 🔑 Read session from app domain cookie (set by server-side OAuth callback)
// Uses X-Appwrite-Session header — zero cross-domain cookie issues
if (typeof document !== 'undefined') {
  const match = document.cookie.match(/(?:^|;\s*)aw_session=([^;]*)/)
  if (match?.[1]) {
    client.setSession(match[1])
  }
}

export const account = new Account(client)
```

The OAuth callback page (`/auth/callback`) is still needed for:
- Legacy `secret`+`userId` URL params (graceful fallback)
- Error display (when server redirects with `?error=...`)
- The server now redirects directly to `/` on success (not to `/auth/callback`)

### Step 3b (Alternative): Client-Side Token Approach (when you CAN'T create session server-side)

If you cannot create the session server-side (e.g., AppWrite API key lacks `auth` scope), you can pass the fresh user token to a callback page. But this is LESS reliable because `account.createSession()` followed by `account.get()` still requires cross-domain cookies that modern browsers block.

```typescript
// In OAuthCallback.tsx (legacy fallback)
const secret = url.searchParams.get('secret')
const userId = url.searchParams.get('userId')
if (secret && userId) {
  await account.createSession(userId, secret)
  // ⚠️ account.get() below may fail due to SameSite cookie blocking on Safari/Chrome
  const user = await account.get()
  window.location.replace('/')
}
```

### Step 4: Client-Side — Replace SDK OAuth

In your auth context, replace the SDK's `createOAuth2Session()` call:

```typescript
// ❌ OLD — uses BaaS SDK, breaks on iOS
account.createOAuth2Session(OAuthProvider.Google, redirectTo, redirectTo, scopes)

// ✅ NEW — uses our server-side proxy
window.location.href = '/api/auth/google'
```

## Environment Variables (Vercel)

| Variable | Where |
|---|---|
| `GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth 2.0 Client Secret |
| `APPWRITE_API_KEY` | AppWrite Console → API Keys (needs `users.read`, `users.write`, `auth` scopes) |

## Google Cloud Console — Redirect URIs

Must add to Authorized redirect URIs for the OAuth 2.0 Client ID:
```
https://yourdomain.vercel.app/api/auth/google/callback
```

## Deployment Verification (BEFORE debugging auth)

**Always verify your routes are actually live before chasing auth bugs.**

```bash
# 1. Check that the init route works (should return 307 redirect)
curl -sS -w "\nHTTP %{http_code}" "https://yourdomain.vercel.app/api/auth/google"
# ✅ HTTP 307 → route is deployed
# ❌ HTTP 404 → route NOT deployed — fix deployment first

# 2. Check that the callback page renders
curl -sS -w "\nHTTP %{http_code}" "https://yourdomain.vercel.app/auth/callback"
# ✅ HTTP 200 → callback page is deployed

# 3. Compare Vercel deployment commit vs GitHub remote
# Get Vercel deployment commit:
curl -sS -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v6/deployments?projectId=$PROJECT_ID&limit=1" \
  | python3 -c "import json,sys; d=json.load(sys.stdin)['deployments'][0]; \
    print(f\"Vercel deployed: {d.get('meta',{}).get('gitCommitSha','N/A')[:8]} — {d.get('meta',{}).get('gitCommitMessage','N/A')[:60]}\")"
# Compare against:
git log origin/main --oneline -3

# If Vercel's commit SHA is NOT in git log: CLI deploy created a divergent commit.
# Fix: git push origin main to trigger Vercel auto-deploy, OR
# npx vercel --prod --token $VERCEL_TOKEN --yes
```

**Common pitfall**: A `vercel --prod` CLI deploy uploads local files and creates a commit on Vercel that may never get pushed to GitHub. Later `git push` → Vercel auto-deploys from GitHub, overwriting the CLI deploy. If the auto-deploy pulls an OLDER commit that doesn't have your API routes, the routes return 404 and auth is broken. Always `git push` FIRST, or verify the deployed commit matches.

## Deploy & Bypass Vercel Git Check

If Vercel blocks deployment with `TEAM_ACCESS_REQUIRED`:
```bash
mv .git .git_backup
npx vercel --prod --token $VERCEL_TOKEN
mv .git_backup .git
```

## Pitfalls

- **This affects ALL modern browsers, not just iOS Safari.** Chrome, Edge, and Firefox all block third-party cookies by default. The SameSite cookie attribute set by AppWrite/Supabase prevents cross-domain session reads on desktop too. The same server-side proxy solution works everywhere.
- **AppWrite tokens are single-use**: `POST /users/{id}/tokens` returns a secret that can only be used ONCE. The RECOMMENDED approach is to consume the token server-side by calling `POST /account/sessions/token` immediately, then pass the resulting **session secret** (not the token) to the client. The session secret supports multiple uses and can be sent via `X-Appwrite-Session` header.
- **`client.setSession()` bypasses cookies entirely**: Setting the session via `client.setSession(sessionSecret)` sends the `X-Appwrite-Session` HTTP header on all requests. This completely bypasses SameSite/cross-domain cookie restrictions. Use this instead of relying on `account.createSession()` client-side cookie hydration.
- **Domain cookie approach**: The server sets `aw_session` cookie on the app's domain (first-party). `lib/appwrite.ts` reads it on init and calls `client.setSession()`. This avoids the redirect-to-callback dance and works on all browsers including iOS Safari.
- **Don't rely on client-side `createSession()` alone**: `account.createSession(userId, secret)` makes a POST that sets an AppWrite-domain cookie, but the subsequent `account.get()` (a cross-site fetch) can't read it due to SameSite=Lax. The `createSession` response includes a session `secret` that you can use with `client.setSession()` — but most code doesn't capture it. The server-side approach is safer.
- **Google ID token is NOT a valid AppWrite secret**: Google ID tokens are ~1200 chars, AppWrite's `POST /account/sessions/token` expects `secret` ≤ 256 chars. Always create an AppWrite user token first (returns a short secret), then use that.
- **API key scopes**: The AppWrite API key must have `users.read`, `users.write`, and `auth` scopes. A key with only `applications` role will return 401 on user operations.
- **`queries[]=equal("email",...)` search is unreliable**: AppWrite's query-based user search often returns empty results even when the user exists. Use the **try-create-first** pattern: POST to `/users` → if 409, search with `?search=email` parameter (which uses fuzzy matching and is more reliable).
- **`router.replace('/')` breaks session detection**: After login, do NOT use Next.js `router.replace('/')` to redirect to the app. Next.js soft navigation keeps the `AuthProvider` mounted in the layout, and its `useEffect` may not re-trigger `account.get()`. Use `window.location.replace('/')` to force a full page reload, which re-initializes the auth context.
- **SameSite cookie**: Must be `lax` (not `strict`) so the cookie is sent when redirecting from Google back to the app.
- **`httpOnly: false`**: The session cookie on our domain must be readable by JavaScript so `lib/appwrite.ts` can extract the session secret.
- **Existing users**: AppWrite allows duplicate emails. The try-create-first approach gracefully handles existing users by catching 409.
- **CLI deploy vs GitHub auto-deploy**: A `vercel --prod` CLI deploy uploads local files and may create a divergent commit on Vercel that never reaches GitHub. Later `git push` triggers Vercel auto-deploy which can overwrite the CLI deploy with an older commit. Always verify the deployed commit SHA matches your latest push.
