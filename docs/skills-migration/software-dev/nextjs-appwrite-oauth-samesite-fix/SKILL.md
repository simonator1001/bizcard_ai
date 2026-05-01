---
name: nextjs-appwrite-oauth-samesite-fix
description: Fix AppWrite OAuth (Google) third-party cookie blocking in Next.js deployed on Vercel
---

# Next.js + AppWrite OAuth: SameSite Cookie Fix

## Problem

AppWrite Web SDK's `account.createSession()` + `account.get()` fail on deployed apps (Vercel, Netlify, etc.) because:

1. `account.createSession()` sets a session cookie on `sgp.cloud.appwrite.io`
2. `account.get()` sends a cross-origin fetch from `yourdomain.vercel.app` to `sgp.cloud.appwrite.io`
3. The AppWrite cookie has `SameSite=Lax` — browsers block it in cross-origin JavaScript fetch requests (Chrome, Safari)
4. Result: `401 - User (role: guests) missing scopes`

## Fix: Server-Side Session Creation + Domain Cookie

**Summary**: Create the session **server-side** (using API key), store the session secret as a cookie on **our own domain**, then the client reads our cookie and calls `client.setSession()`. This completely bypasses third-party cookie blocking — no cross-domain cookie needed.

### Step 1: Server-side callback creates session

In `app/api/auth/google/callback/route.ts`:

```ts
// Create session using the one-time token (SERVER-SIDE — consumes the token)
const sessionRes = await fetch(`${appwriteEndpoint}/account/sessions/token`, {
  method: 'POST',
  headers: awHeaders,
  body: JSON.stringify({ userId, secret: tokenData.secret }),
})
const sessionData = await sessionRes.json()

// Set session secret as a cookie on OUR domain (not AppWrite's)
const response = NextResponse.redirect(new URL('/', request.url))
response.cookies.set('aw_session', sessionData.secret, {
  httpOnly: false,   // JS needs to read it
  secure: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
})
return response
```

### Step 2: Client reads cookie and sets session

In `lib/appwrite.ts`:

```ts
import { Client, Account } from 'appwrite'

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT)

// Read session from our domain cookie (set by server-side OAuth callback)
if (typeof document !== 'undefined') {
  const match = document.cookie.match(/(?:^|;\s*)aw_session=([^;]*)/)
  if (match?.[1]) {
    client.setSession(match[1]) // sets X-Appwrite-Session header
  }
}

export const account = new Account(client)
```

### Step 3: Clear cookie on sign-out

```ts
signOut: async () => {
  await account.deleteSession('current')
  document.cookie = 'aw_session=; path=/; max-age=0'
}
```

## Why This Works

- The session secret is stored in a cookie on **our domain** (e.g., `bizcardai.vercel.app`)
- The client reads it from `document.cookie` — no cross-domain access needed
- `client.setSession()` sets the `X-Appwrite-Session` header on all API calls
- AppWrite SDK uses this header for auth — no cookies involved in the API calls
- Zero cross-domain cookie issues

## Pitfalls

- `httpOnly: false` means JS can read the cookie. For production, consider using an API endpoint to read an httpOnly cookie and return user data.
- The server-side session creation **consumes the one-time token** — don't also pass the token to the client.
- Redirect on success goes to `/` directly (bypassing `/auth/callback`); on error, redirect to `/auth/callback?error=...`.
- Cookie `maxAge` should match or exceed the AppWrite session lifetime.
