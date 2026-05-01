---
name: supabase-to-appwrite-migration
description: "Migrate a Next.js app from Supabase to AppWrite — auth, DB CRUD, middleware, build-fix cycle."
version: 1.1.0
---

# Supabase to AppWrite Migration

## When to Use

Use this skill when migrating a Next.js (or React) web app from Supabase backend to AppWrite, OR when debugging a migration that was supposedly "done" but has broken upload flows, data layer stubs, missing API routes, or image display issues. Also use when supplementary feature pages (Companies, News, Network) that weren't touched in the initial migration still show Supabase errors, when Pages Router API routes were overlooked, when client-side auth stubs send fake user IDs, or when third-party APIs (OCR, AI) mask migration success. Applies when:
- Swapping `@supabase/ssr` + `@supabase/supabase-js` for `appwrite`
- Replacing Supabase Auth (email + OAuth) with AppWrite Account API
- Replacing Supabase `from().select/insert/update/delete` with AppWrite Databases API
- Simplifying Next.js middleware from Supabase session management to AppWrite cookie check
- Dealing with cascading TypeScript type errors from `User.id` → `AppWriteUser.$id`
- **Debugging AppWrite Google OAuth failures** — iOS Safari ITP blocking, `general_unauthorized_scope` errors, cookie vs token-based OAuth, callback retry strategies

## Key Differences: Supabase vs AppWrite

| Concept | Supabase | AppWrite |
|---------|----------|----------|
| Auth client | `supabase.auth` | `account` (from `new Account(client)`) |
| DB client | `supabase.from('table')` | `databases` (from `new Databases(client)`) |
| User ID field | `user.id` | `user.$id` |
| User name field | `user.user_metadata.name` | `user.name` |
| User avatar | `user.user_metadata.avatar_url` | `user.prefs?.avatar_url` |
| Created date | `user.created_at` | `user.$createdAt` |
| Last sign-in | `user.last_sign_in_at` | Not directly exposed |
| Auth provider | `user.app_metadata.provider` | Check via `account.listSessions()` |
| OAuth flow | `signInWithOAuth({ provider, options })` | `account.createOAuth2Session(provider, success, failure)` — use `createOAuth2Token` for iOS Safari (see pitfall below) |
| Session check | `supabase.auth.getSession()` | `account.get()` (throws if no session) |
| Auth state change | `onAuthStateChange(() => {})` | None — poll or call `account.get()` |
| Document ID | `.eq('id', id)` | `$id` returned from create; use directly |
| Query filter | `.eq('field', value)` | `Query.equal('field', value)` |
| Order | `.order('col', { ascending: false })` | `Query.orderDesc('$createdAt')` |
| Count | `.select('*', { count: 'exact' })` | `listDocuments` returns `{ total, documents }` |
| Middleware session | `createServerClient` + cookie management | Check for `a_session_` cookie |

## Migration Steps

### 1. Install AppWrite SDK
```bash
npm install appwrite
```

### 2. Create `lib/appwrite.ts` Client Config
```typescript
import { Client, Account, Databases, ID } from 'appwrite'

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

export const account = new Account(client)
export const databases = new Databases(client)
export { ID }
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
export const CARDS_COLLECTION = 'business_cards'
```

### 3. Rewrite Auth Context (`lib/auth-context.tsx`)
- Replace `import { supabase } from '@/lib/supabase-client'` with `import { account } from '@/lib/appwrite'`
- Define `AppWriteUser` interface: `{ $id, email, name }`
- `getSession()` → `account.get()` wrapped in try/catch (401 = no session)
- `signInWithPassword()` → `account.createEmailPasswordSession(email, password)`
- `signUp()` → `account.create(email, password, name)` then `account.createEmailPasswordSession()`
- `signOut()` → `account.deleteSession('current')`
- `signInWithOAuth()` → `account.createOAuth2Session(OAuthProvider.Google, successUrl, failureUrl)`
- Remove `onAuthStateChange` subscription — AppWrite has no equivalent
- Import `OAuthProvider` from `appwrite` (not a string literal)
  - **OAuthProvider trap**: If `signInWithProvider` has type `(provider: 'google')`, you CANNOT do `provider as 'google'` — TypeScript struggles with casting string literals to the enum. Instead, use `OAuthProvider.Google` directly. Adding `case 'facebook':` to a switch on a parameter typed `'google'` causes "type not comparable" — just call `OAuthProvider.Google` since the type already restricts it.

### 4. Rewrite OAuth Callback

**CRITICAL: You MUST create the physical callback route page.** The OAuth redirect URL (e.g., `/auth/callback`) must resolve to an actual page.

**For Next.js App Router**, create the route file:
```
app/auth/callback/page.tsx
```
The page should use the `OAuthCallback` component that calls `account.get()` to verify the session was established.

**Also create a legacy redirect** for any old OAuth flows still pointing to `/callback`:
```
app/callback/page.tsx  →  redirect('/auth/callback')
```

Without this physical route, the OAuth flow will redirect the user to a "Page not found" error after Google authentication.

- Replace `supabase.auth.exchangeCodeForSession(code)` with `account.get()`
- AppWrite sets session cookie during OAuth redirect; just verify it's active

#### 🚨 OAuth Callback Returns Generic "Authentication Failed" — Surface the Real Error

**Symptom**: After Google sign-in, the callback page shows "Authentication failed. Please try signing in again." — no clue what actually went wrong.

**Root cause**: The callback component catches the error from `account.get()` but only shows a hardcoded generic message. The real error (e.g., `Code: 401 | Type: general_unauthorized_scope | OAuth: access_denied` from Google) is hidden in the console.

**Fix — Enhance the OAuthCallback to display ALL error details on screen:**

```tsx
// In the catch block of processAuth():
catch (err: any) {
  console.error('[OAuthCallback] Error details:', {
    code: err?.code,
    type: err?.type,
    message: err?.message,
    response: err?.response,
  })

  // Build detailed error message for debugging
  const errorParts: string[] = []
  if (err?.code) errorParts.push(`Code: ${err.code}`)
  if (err?.type) errorParts.push(`Type: ${err.type}`)
  if (err?.message) errorParts.push(`Message: ${err.message}`)
  if (errorParam) errorParts.push(`OAuth: ${errorParam}`)
  if (errorDescription) errorParts.push(`Description: ${errorDescription}`)

  const detailError = errorParts.length > 0
    ? errorParts.join(' | ')
    : (err instanceof Error ? err.message : 'Unknown error')

  setError(detailError)
  setStatus('error')
}
```

**Also log the URL search params** before calling `account.get()`:
```tsx
const url = new URL(window.location.href)
console.log('[OAuthCallback] URL:', window.location.href)
console.log('[OAuthCallback] Search params:', Object.fromEntries(url.searchParams))
```

**How to decode the error**: Common Google OAuth errors in URL params:
- `error=access_denied` — Google OAuth consent screen in "Testing" mode, user not in test users list. Fix: Google Cloud Console → OAuth consent screen → add user email as test user
- `error=redirect_uri_mismatch` — The redirect URI sent by AppWrite doesn't match what's registered in Google Cloud Console. Fix: add `https://{region}.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/{projectId}` to Authorized redirect URIs
- `Code: 401 / Type: general_unauthorized_scope` — AppWrite session wasn't created. Can indicate Google OAuth consent screen blocking the app, or session cookie domain mismatch

### 5. Rewrite Database Hooks
- Map AppWrite docs with a reusable `mapDocument` utility:
  ```typescript
  function mapDocument<T>(doc: any): T {
    return { ...doc, id: doc.$id, created_at: doc.$createdAt, updated_at: doc.$updatedAt } as unknown as T
  }
  ```
  Use it everywhere: `res.documents.map(mapDocument<TrackedCompany>)`. Without explicit type annotation for array returns, TypeScript may infer `unknown[]` — always specify: `res.documents.map(doc => mapDocument<SpecificType>(doc))`.
- `supabase.from().select().eq()` → `databases.listDocuments(dbId, collId, [Query.equal(...)])`
- `supabase.from().insert()` → `databases.createDocument(dbId, collId, ID.unique(), data)`
- `supabase.from().update()` → `databases.updateDocument(dbId, collId, docId, data)`
- `supabase.from().delete()` → `databases.deleteDocument(dbId, collId, docId)`
- Import `Query` from `appwrite`

### 6. Simplify Middleware
Replace complex Supabase session middleware with simple cookie check:
```typescript
function hasAppWriteSession(request: NextRequest): boolean {
  return request.cookies.getAll().some(c => c.name.startsWith('a_session_'))
}
```
No need for `createServerClient`, cookie management, or token refresh. Just check for the AppWrite session cookie.

### 7. Set Environment Variables
```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=69efa226000db23fcd89
NEXT_PUBLIC_APPWRITE_DATABASE_ID=bizcard_ai
```
Always use fallback defaults in `lib/appwrite.ts` so the app works even without env vars:
```typescript
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '69efa226000db23fcd89'
```

### 8. Switching AppWrite Projects/Regions

When the user provides a new AppWrite project ID and API key for a different region:

1. **Save the API key** to `~/.hermes/.env` with a descriptive name (e.g., `APPWRITE_API_KEY`)
2. **Save project + endpoint** (e.g., `APPWRITE_ENDPOINT_SGP`, `APPWRITE_PROJECT_SGP`)
3. **Update `lib/appwrite.ts`** — change endpoint and project ID defaults
4. **Update `DATABASE_ID`** — use the new database name (create it if needed)
5. **Create database + collections** programmatically (see AppWrite Collection Setup above — Option A)
6. **Rebuild, commit, push** — verify `npm run build` passes with zero errors

AppWrite region endpoints:
- Frankfurt: `https://fra.cloud.appwrite.io/v1`
- Singapore: `https://sgp.cloud.appwrite.io/v1`
- US: `https://cloud.appwrite.io/v1`

## 🚨 Critical Pitfalls

### The `git checkout` Trap
**NEVER run `git checkout -- .` after subagents have written files.** It wipes ALL uncommitted changes including subagent work. If you need to revert specific files, checkout them individually:
```bash
git checkout -- path/to/specific/file.tsx
```

### AppWrite REST API via execute_code

When calling AppWrite REST API from `execute_code`, the `terminal()` function returns a **dict** `{"output": "...", "exit_code": N}`, NOT a string. Use:
```python
from hermes_tools import terminal, json_parse
r = terminal('curl ...')
data = json_parse(r["output"])  # NOT json.loads(r)
```
Forgetting this causes `TypeError: the JSON object must be str, bytes or bytearray, not dict`.
Not every `user.id` should become `user.$id`. Files using Supabase's `createClient(@supabase/ssr)` or `createServerClient` still use Supabase `User` type with `.id`. Only change `user.id` in files that import `useAuth()` (which returns `AppWriteUser`).

**How to identify which files to fix:**
```bash
# Files that use useAuth AND have user.id — these need $id
grep -rl 'useAuth' --include="*.tsx" --include="*.ts" . | xargs grep -l 'user\.id'
```

**How to do surgical replacement (Python, avoids false matches on user_id):**
```python
import re
content = re.sub(r'(?<!_)user(!?)\.id\b', r'user\1.\$id', content)
```

### Vercel Build Fails Because `appwrite` Package Not in `package.json`

**Symptom**: Build passes locally (`npx next build`) but fails on Vercel with `Module not found: Can't resolve 'appwrite'`. Import trace points to `./lib/appwrite.ts`.

**Root cause**: `lib/appwrite.ts` imports from `appwrite` but it was never added to `package.json` dependencies. Locally it works because `node_modules` has it from a manual install. Vercel does a fresh `npm install` from `package.json` only.

**Fix**: Add `"appwrite": "^14.0.0"` to `dependencies` in `package.json`, commit, push, redeploy.

**Prevention**: After `npm install appwrite`, always verify:
```bash
grep appwrite package.json
```

### Vercel Detects Wrong Package Manager (pnpm vs npm)

**Symptom**: Vercel build fails with `Command "pnpm install" exited with 1`. Log shows `Skipping build cache since Package Manager changed from "npm" to "pnpm"`.

**Root cause**: `pnpm-lock.yaml` exists in the repo. Vercel auto-detects it and switches to pnpm, but dependencies aren't pnpm-compatible.

**Fix**: Remove `pnpm-lock.yaml`:
```bash
rm pnpm-lock.yaml
git add pnpm-lock.yaml
git commit -m "fix: remove pnpm-lock to force npm on Vercel"
git push
```

### Vercel Deploy Requires CLI When No GitHub Integration

**Symptom**: GitHub push succeeds but Vercel never auto-deploys. The project has no GitHub integration — all previous deploys were via CLI (`source: "cli"` in deployment metadata).

**Fix**: Deploy manually via Vercel CLI with the API token:
```bash
VERCEL_ORG_ID=team_xxx VERCEL_PROJECT_ID=prj_xxx \
  vercel deploy --prod --token "$VERCEL_TOKEN" --yes
```

### The Build-Fix Cycle
After migration, expect 10-30 type errors. Fix them iteratively:
1. `npm run build 2>&1 | grep "Type error:"` to find errors
2. Fix one file at a time
3. Rebuild to find the next error
4. Use `git checkout -- file.tsx` to revert any over-fixes

**Tip**: When the build output is very long, use `npm run build 2>&1 | tail -50` to see just the final errors. Only one error is shown per build — after fixing it, rebuild to find the next one. Don't try to fix multiple errors at once, as TypeScript stops after the first failure.

### Supabase-Specific Properties to Replace
- `user.user_metadata?.name` → `user.name`
- `user.user_metadata?.avatar_url` → `user.prefs?.avatar_url`
- `user.user_metadata?.full_name` → `user.name`
- `user.created_at` → `user.$createdAt`
- `user.last_sign_in_at` → not available (use `null` or remove)
- `user.app_metadata?.provider` → check via `account.listSessions()`

### 🚨 Empty Collection Permissions → 401 on All DB Operations

**Symptom**: Auth works (login succeeds, `account.get()` returns user), but every `databases.listDocuments()` / `createDocument()` call fails with `AppwriteException code: 401 type: user_unauthorized`. The console shows "Total cards in database for user: 0" despite knowing cards exist in the database.

**Root cause**: The AppWrite collection was created (or already exists) but has **no permissions** set — `$permissions: []`. With zero permissions, NO user (including authenticated ones) can read or write documents. The AppWrite Console may show the collection exists, but without explicit `read("any")` or `read("users")`, all client SDK calls are denied.

**How to detect**:
```bash
KEY=$(grep APPWRITE_API_KEY ~/.hermes/.env | sed 's/APPWRITE_API_KEY=//')
curl -s "https://sgp.cloud.appwrite.io/v1/databases/{DB_ID}/collections/{COL_ID}" \
  -H "X-Appwrite-Key: $KEY" \
  -H "X-Appwrite-Project: {PROJECT_ID}" | python3 -c "
import json,sys; d=json.load(sys.stdin)
print('Permissions:', d.get('\$permissions'))
print('DocSecurity:', d.get('documentSecurity'))
"
```
If `Permissions: []` — this is the problem.

**Fix — Set permissions via REST API**:
```bash
curl -s -X PUT "https://sgp.cloud.appwrite.io/v1/databases/{DB_ID}/collections/{COL_ID}" \
  -H "X-Appwrite-Key: $KEY" \
  -H "X-Appwrite-Project: {PROJECT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Collection Name",
    "documentSecurity": true,
    "permissions": [
      "read(\"any\")",
      "create(\"users\")",
      "update(\"users\")",
      "delete(\"users\")"
    ]
  }'
```

**Permission meanings**:
| Permission | Who can |
|---|---|
| `read("any")` | Any user (even unauthenticated) can read |
| `read("users")` | Only authenticated users can read |
| `create("users")` | Authenticated users can create documents |
| `update("users")` | Document owner can update (requires `documentSecurity: true`) |
| `delete("users")` | Document owner can delete (requires `documentSecurity: true`) |

**Note**: `documentSecurity: true` means each document tracks its owner and only the owner can update/delete. Without this, `update("users")` allows ANY authenticated user to update ANY document.

### 🚨 Admin-Created Documents Not Visible to Users

**Symptom**: Documents created via API with server-side key (`X-Appwrite-Key`) are invisible to the client SDK even after permissions are fixed. `databases.listDocuments()` returns 0 for those documents.

**Root cause**: When `documentSecurity: true` and documents are created via server-side API key, the documents' `$permissions` are empty or set to the admin user. The client-side user has no read access to those specific documents.

**Fix**: When creating documents via server-side API, include `permissions` in the document body:
```json
{
  "documentId": "doc_123",
  "data": { "user_id": "xxx", "name": "..." },
  "permissions": [
    "read(\"user:USER_ID\")",
    "update(\"user:USER_ID\")",
    "delete(\"user:USER_ID\")"
  ]
}
```
Or set `documentSecurity: false` on the collection if document-level ownership is not needed.

### AppWrite Collection Setup

**Option A: Via REST API with server-side API key (preferred — fully automated)**

Use `execute_code` with the `terminal` tool to create the database, collection, and attributes programmatically:

```python
from hermes_tools import terminal, json_parse
import json

# Config
endpoint = "https://sgp.cloud.appwrite.io/v1"
project_id = "69efa226000db23fcd89"
api_key = "standard_..."  # From ~/.hermes/.env APPWRITE_API_KEY

headers = f'-H "X-Appwrite-Key: {api_key}" -H "X-Appwrite-Project: {project_id}" -H "Content-Type: application/json"'

# 1. Create database
r = terminal(f'curl -s -X POST "{endpoint}/databases" {headers} -d \'{{"databaseId":"bizcard_ai","name":"BizCard AI"}}\'')
db_data = json_parse(r["output"])
database_id = db_data.get("$id", "bizcard_ai")

# 2. Create collection
r = terminal(f'curl -s -X POST "{endpoint}/databases/{database_id}/collections" {headers} -d \'{{"collectionId":"business_cards","name":"Business Cards","documentSecurity":false}}\'')

# 3. Add attributes
attrs = [("user_id", 255, True), ("name", 255, False), ...]
for key, size, required in attrs:
    body = json.dumps({"key": key, "type": "string", "size": size, "required": required})
    terminal(f'curl -s -X POST "{endpoint}/databases/{database_id}/collections/business_cards/attributes/string" {headers} -d \'{body}\'')
```

**Important**: `terminal()` returns `{"output": "...", "exit_code": N}` — use `json_parse(r["output"])` not `json.loads(r)`.

**Option B: Via AppWrite Console (manual)**
Create collections at the AppWrite web console if no server-side API key is available.

### Google OAuth Redirect URI
When using AppWrite Google OAuth, the redirect URI must be added to Google Console:
```
https://{REGION}.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/{PROJECT_ID}
```
The region AND project ID must match the `lib/appwrite.ts` config. Switching regions (e.g., Frankfurt → Singapore) requires a NEW redirect URI in Google Console.

### 🚨 Vercel Environment Variables Override Code Defaults

**This is the #1 cause of "deployed app uses wrong config" bugs.**

When `lib/appwrite.ts` has fallback defaults:
```typescript
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
```

Vercel env vars take priority over the `||` fallback. If Vercel has OLD values set (e.g., `NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1`), the code default is **never used** — even after pushing new code.

**Symptoms**: 
- Build passes ✅ → Push succeeds ✅ → App loads ✅ → OAuth/login/calls go to WRONG endpoint ❌
- The deployed app redirects to old project URLs despite local code being correct
- Supabase client loads even though code has zero Supabase imports (because Vercel still has `NEXT_PUBLIC_SUPABASE_URL` set)

**How to detect**: Open browser console on the deployed app and look for debug logs. If `[AuthContext] Redirecting to OAuth:` shows the wrong region/project, the issue is Vercel env vars.

**Fix**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. **Delete** all OLD AppWrite/Supabase vars: `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Redeploy** (Deployments → latest → Redeploy)
4. Verify in browser console that the correct OAuth URL is generated

**Prevention**: After any project/region switch, ALWAYS check Vercel env vars. Code defaults are only used when vars are absent.

### 🚨 Vercel Auto-Deploy Silently Broken

**Symptom**: Commits push to GitHub successfully (`git push origin main`) but the deployed app never updates. The browser console still shows old debug strings, old OAuth URLs, and old dependencies days after the fix was pushed.

**How to detect**: 
1. Push a new commit with a distinctive change (e.g., a new route, a debug log, or an obvious UI tweak)
2. Wait 1-2 minutes
3. Navigate to the deployed site and check the browser console — if the change isn't there, auto-deploy is broken
4. Confirm by checking the latest deployment timestamp at `https://vercel.com/<user>/<project>/deployments`

**Fix**:
1. Go to Vercel Dashboard → Deployments
2. Find the latest commit → **Redeploy** manually (⋮ menu → Redeploy)
3. If manual redeploy also fails, check the GitHub integration under Settings → Git — reauthorize if needed
4. If the Vercel CLI is available locally and `VERCEL_TOKEN` is set, force deploy:
   ```bash
   npx vercel deploy --prod --token "$VERCEL_TOKEN" --yes
   ```

**This is a SEPARATE issue from env var overrides.** Even with correct code and clean env vars, the deployment itself may be stuck on an old build because Vercel never received the GitHub webhook.

### 🚨 Vercel CLI Deploy Blocked by Team Seat Verification

**Symptom**: `npx vercel deploy --prod` fails instantly with `Error: Unexpected error. Please try again later.` No build logs, no type errors — just a generic error message.

**Root cause**: The Git commit author email doesn't match a verified team member on Vercel. The deployment shows `readyStateReason: "Git author X must have access to the team Y on Vercel to create deployments"` and `seatBlock: {blockCode: 'TEAM_ACCESS_REQUIRED'}`.

**How to detect**: Query the deployment via Vercel API to see the real error:
```bash
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v13/deployments/<DEPLOYMENT_ID>" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('readyStateReason')); print(d.get('seatBlock'))"
```
Look for `readyStateReason` and `seatBlock` fields — these contain the real error that the CLI hides behind "Unexpected error."

**Fix**:
1. Go to Vercel Dashboard → Team Settings → Members → add the Git commit author email as a verified member
2. Or log in to Vercel CLI with `vercel login` using the account that owns the team
3. Or disable team seat verification in Vercel project settings (Settings → Security → Access Control)"

### 🚨 Middleware Still Checks Supabase Sessions After Migration

**Symptom**: The deployed app works locally but shows "Page not found" or redirects to `/signin` on Vercel. Even `/signin` may fail to load, or the landing page returns 404.

**Root cause**: `middleware.ts` still imports from `@supabase/ssr` and calls `createServerClient(supabaseUrl, anonKey, ...)`. If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` were deleted from Vercel env vars (as recommended after migration), `createServerClient(undefined, undefined, ...)` crashes. The crash is caught by a try/catch block that redirects to `/signin` — but `/signin` may also fail because the middleware intercepts it too.

**How to detect**: 
1. Search for Supabase imports in middleware:
   ```bash
   grep -n "supabase" middleware.ts
   ```
2. Check the Vercel deployment logs for `[Middleware] Unexpected error:` or `[Middleware] Session error:`
3. If `/` is in PUBLIC_ROUTES but still redirects, middleware is crashing

**Fix — Full middleware rewrite** (replace entire file):

AppWrite auth is client-side only — `account.get()` requires browser context, so middleware can't verify sessions the way Supabase could. The simplest correct approach: keep public routes bypass, pass through everything else, and let the client-side `AuthProvider` handle redirects.

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/', '/signin', '/signup', '/auth/callback', '/callback',
  '/auth/debug', '/reset-password', '/forgot-password', '/verify',
  '/api/auth', '/api/scan', '/api/ocr', '/api/extract-info',
  '/images', '/assets', '/pricing', '/manage',
  '/payment/success', '/companies',
]

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

function isPublicPath(path: string): boolean {
  const normalizedPath = path.replace(/\/$/, '')
  if (normalizedPath === '') return true
  return PUBLIC_ROUTES.some(
    route => normalizedPath === route || normalizedPath.startsWith(route + '/')
  )
}

function isStaticAsset(path: string): boolean {
  return /\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/.test(path)
}

export async function middleware(request: NextRequest) {
  const path = new URL(request.url).pathname

  // Allow public routes, static assets, and API routes
  if (isPublicPath(path) || isStaticAsset(path) || path.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Pass through — client-side AuthProvider handles auth gating
  return NextResponse.next()
}
```

**Key points**:
- Remove ALL Supabase imports (`@supabase/ssr`, `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`)
- Remove subscription middleware calls (they were Supabase-dependent)
- Remove cookie management (`createServerClient` cookie handlers)
- The `a_session_` cookie check is optional — AppWrite sets it, but the middleware doesn't need to validate it
- Client-side `AuthProvider` already handles auth state and redirects

### 🚨 iOS Safari Blocks `createOAuth2Session` — Use `createOAuth2Token` Instead

**Symptom**: Google OAuth works on desktop Chrome but fails on iOS Safari. User clicks "Sign in with Google" → never sees Google's login page → lands on `/auth/callback` with error `Code: 401 | Type: general_unauthorized_scope | User (role: guests) missing scopes (["account"])`. Debug info shows: `AppWrite cookie: NO`, `URL params: (none)`.

**Root cause**: `createOAuth2Session` sets a session cookie on AppWrite's domain (`sgp.cloud.appwrite.io`). iOS Safari's **Intelligent Tracking Prevention (ITP)** blocks third-party cookies — the cookie set during the OAuth redirect is silently dropped. When `account.get()` is called from the callback page, AppWrite sees no session → returns 401.

**Same issue on**: Firefox with Enhanced Tracking Protection (ETP) enabled. Desktop Chrome/Safari allow third-party cookies by default (with upcoming phase-outs).

**Fix — Switch to `createOAuth2Token`** (JWT token-based, no cookies):

```typescript
// In signInWithProvider (auth-context.tsx):
// ❌ BROKEN on iOS Safari — cookies blocked by ITP
account.createOAuth2Session(OAuthProvider.Google, redirectTo, redirectTo, ['profile', 'email'])

// ✅ WORKS on iOS Safari — JWT stored in SDK memory, not cookies  
await account.createOAuth2Token(OAuthProvider.Google, redirectTo, redirectTo, ['profile', 'email'])
```

**Critical**: `createOAuth2Token` returns a Promise — it MUST be `await`ed. Without `await`, the redirect may fail silently and the catch block for fallback redirects never executes (unhandled promise rejection).

**Callback changes**: The token-based flow may need more time for the token to propagate. Increase retry count from 3 to 5 with staggered delays:
```typescript
for (let attempt = 0; attempt < 5; attempt++) {
  const delay = attempt === 0 ? 500 : 1500 + (attempt * 1000)
  await new Promise(resolve => setTimeout(resolve, delay))
  try {
    const user = await account.get()  // Uses JWT header, not cookies
    if (user) { /* success! redirect to app */ }
  } catch (err) { /* log and retry */ }
}
```

**Verification**: After the fix, the flow should work identically: sign-in → Google login → callback → `account.get()` succeeds → redirect to app. The difference is invisible to users — the JWT is managed automatically by the AppWrite SDK.

**If `createOAuth2Token` still fails**: The AppWrite SDK may lose auth state across HTTP redirects (fresh page load after OAuth → no session in memory/localStorage/cookies). Implement a **server-side OAuth proxy** that handles the entire flow in API routes and sets a first-party session cookie. See "Server-Side OAuth Proxy" section below.

### 🚨 AppWrite OAuth Fails: "Invalid URI — Register as Web Platform"

**Symptom**: Clicking "Sign in with Google" correctly redirects to AppWrite's OAuth endpoint, but AppWrite shows: *"Invalid `success` param: Invalid URI. Register your new client (domain.com) as a new Web platform on your project console dashboard"*

**Root cause**: AppWrite requires every domain that calls `createOAuth2Session` to be registered as a Web **platform** in the project. This is separate from Google OAuth redirect URIs — it's AppWrite's own domain whitelist.

**Fix**:
1. Check existing platforms:
   ```bash
   curl -s "https://sgp.cloud.appwrite.io/v1/projects/{PROJECT_ID}/platforms" \
     -H "X-Appwrite-Key: $APPWRITE_API_KEY" \
     -H "X-Appwrite-Project: {PROJECT_ID}"
   ```
2. **If API key lacks `platforms.write` scope**: Update the key first:
   ```bash
   # Get current scopes
   curl -s "https://sgp.cloud.appwrite.io/v1/projects/{PROJECT_ID}/keys/{KEY_ID}" \
     -H "X-Appwrite-Key: $APPWRITE_API_KEY" \
     -H "X-Appwrite-Project: {PROJECT_ID}"
   # PUT back with added scopes
   curl -s -X PUT "https://sgp.cloud.appwrite.io/v1/projects/{PROJECT_ID}/keys/{KEY_ID}" \
     -H "X-Appwrite-Key: $APPWRITE_API_KEY" \
     -H "X-Appwrite-Project: {PROJECT_ID}" \
     -H "Content-Type: application/json" \
     -d '{"name":"hermes","scopes":[...existing scopes..., "platforms.read", "platforms.write"]}'
   ```
3. Register the platform (requires `platformId` in body):
   ```bash
   curl -s -X POST "https://sgp.cloud.appwrite.io/v1/projects/{PROJECT_ID}/platforms" \
     -H "X-Appwrite-Key: $APPWRITE_API_KEY" \
     -H "X-Appwrite-Project: {PROJECT_ID}" \
     -H "Content-Type: application/json" \
     -d '{"platformId":"unique()","type":"web","name":"Production","hostname":"domain.com"}'
   ```
4. After registration, the OAuth flow will redirect to Google sign-in successfully. No code changes needed — the callback route and `OAuthCallback` component remain unchanged.

### 🚨 Pages Router API Routes MISSED During Migration — Must Check ALL pages/api/*.ts\n\n**Symptom**: Auth + DB work, but specific flows (upload, scan, OCR pipeline) silently fail after migration. The build passes because Pages Router routes aren't type-checked during `next build` the same way App Router routes are.\n\n**Root cause**: The initial migration focused on App Router files (`app/api/*`, `lib/*`, `contexts/*`), but Pages Router API routes (`pages/api/*.ts`) were completely overlooked. These routes still import `supabase`, `supabaseAdmin`, `createServerComponentClient`, etc., and crash at runtime.\n\n**How to detect**:\n```bash\n# Find ALL Supabase references in Pages Router API routes\nfind pages/api -name \"*.ts\" -exec grep -l \"supabase\\|createClient\\|createServer\" {} \\;\n\n# Also check for Supabase imports in ALL source files (not just app/)\ngrep -rn \"from.*supabase\\|require.*supabase\" pages/ --include=\"*.ts\" --include=\"*.tsx\"\n```\n\n**Fix**: Rewrite each Pages Router API route to use AppWrite REST API (server-side key) or the AppWrite client SDK (if client-side). Remove all Supabase imports. For routes that forward auth, accept `userId` in the request body instead of checking Supabase sessions.\n\n**Common pattern for Pages Router → AppWrite REST**:\n```typescript\n// ❌ Supabase-based\nimport { supabase, supabaseAdmin } from '@/lib/supabase-client'\nconst { data: { session } } = await supabase.auth.getSession()\nconst { data } = await supabaseAdmin.from('table').insert(data).select()\n\n// ✅ AppWrite REST\nconst headers = { 'X-Appwrite-Project': PROJECT_ID, 'X-Appwrite-Key': API_KEY, 'Content-Type': 'application/json' }\nconst { userId } = req.body  // Accept userId from client, skip server-side session check\nconst res = await fetch(`${ENDPOINT}/databases/${DB}/collections/${COL}/documents`, { method: 'POST', headers, body: JSON.stringify({ documentId: docId, data: { ...cardData, user_id: userId } }) })\n```\n\n### 🚨 Client-Side Auth Stubs (`access_token: 'disabled'`) Survive Migration\n\n**Symptom**: Upload/scan appears to work (no JS errors), but cards never appear in the Manage view. Console shows no errors, but cards saved with `user_id: 'disabled'` — invisible to the real user.\n\n**Root cause**: During migration, the developer added a Supabase auth stub:\n```typescript\n// DISABLED: Supabase removed - auth stub\nconst refreshedSession = { access_token: 'disabled', user: { id: 'disabled' }, expires_at: Date.now()/1000 + 3600 };\nconst accessToken = refreshedSession.access_token;\n// ...later...\nbody: JSON.stringify({ image: base64, userId: refreshedSession.user.id })  // sends 'disabled'!\n```\nThis stub sends `userId: 'disabled'` to the API, so all cards are created with the wrong owner. The API route then fails silently because the fake Supabase token can't be verified.\n\n**How to detect**:\n```bash\ngrep -rn \"access_token.*disabled\\|user.*id.*disabled\" components/ app/\n```\n\n**Fix**: Replace the stub with the real AppWrite user:\n```typescript\nimport { useAuth } from '@/lib/auth-context'\nconst { user } = useAuth()\n\n// In the upload handler:\nif (!user) throw new Error('Please sign in to upload cards')\nconst userId = user.$id\n// ...\nbody: JSON.stringify({ image: base64, userId })  // real AppWrite user ID!\n```\n\n**Important**: If the parent component already calls `useBusinessCards()` (which internally calls `useAuth()`), importing `useAuth` separately can cause webpack \"redefined\" errors. Fix by exporting `user` from the business cards hook:\n```typescript\n// In useBusinessCards.ts:\nreturn { cards, loading, error, addCard, updateCard, deleteCard, refresh, user }\n\n// In the component — no separate useAuth() import needed:\nconst { cards, user } = useBusinessCards()\n```\n\n### 🚨 Broken Upload/Scan Flow — Original (Before Adding Pages Router Check)

**Symptom**: Auth works (login succeeds, `useBusinessCards` returns real data), but uploading/scaning a business card silently fails. User clicks "Upload Images", sees "Processing card..." briefly, then nothing — no card appears in Manage view. Console may show no errors, or a 404 for `/api/scan`.

**Root cause — THREE layers of breakage**:
1. **Upload flow still uses `access_token: 'disabled'`**: The HomePage/Scan component has a Supabase stub like `const refreshedSession = { access_token: 'disabled', user: { id: 'disabled' } }` — it sends `'disabled'` as the auth token to the scan API.
2. **`/api/scan` route doesn't exist**: The old `pages/api/scan.ts` (Supabase-based) was deleted during migration, but the new `app/api/scan/route.ts` (AppWrite-based) was NEVER created.
3. **ManageCardsView has its own Supabase-stubbed `fetchCards`**: Even if cards get into the database (via API key), the Manage view uses its OWN `fetchCards` implementation that's still a Supabase stub (`console.log('[DISABLED] fetchCards: Supabase removed')` + `setCards([])`). It doesn't use the `useBusinessCards()` hook.

**How to detect**:
```bash
# 1. Check for fake auth tokens in upload components
grep -rn "access_token.*disabled" components/ app/

# 2. Check if scan API exists
ls app/api/scan/route.ts pages/api/scan.ts

# 3. Check ManageCardsView for independent Supabase stubs
grep -n "DISABLED\|Supabase removed" components/cards/ManageCardsView.tsx
```

**Fix — Complete three-part fix**:

**Part 1: Create `/api/scan/route.ts` (AppWrite REST API — NOT SDK)**

⚠️ The `appwrite` npm package v14 `Client` class does NOT have `setKey()` for server-side API key auth. Vercel build will fail with `Type error: Property 'setKey' does not exist on type 'Client'`. Use REST API directly:

```typescript
import { NextRequest, NextResponse } from 'next/server'

// Use REST API, NOT the appwrite SDK (no setKey() on client SDK)
const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
const PROJECT_ID = '69efa226000db23fcd89'
const DATABASE_ID = 'bizcard_ai'
const CARDS_COLLECTION = 'business_cards'
const STORAGE_BUCKET = 'card_images'

function headers() {
  return {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
    'Content-Type': 'application/json',
  }
}

export async function POST(request: NextRequest) {
  const { image, userId } = await request.json()
  // 1. Upload image to AppWrite Storage (multipart form)
  // 2. Create card document in business_cards collection
  // 3. Auto-create bucket + collection + attributes on first use (404→create→retry)
  // See full implementation in the skill references
}
```

**Key auto-provisioning pattern**: When the storage bucket or collection returns 404, create it on-the-fly and retry:
```typescript
if (uploadRes.status === 404) {
  // Create bucket → retry upload
}
if (docRes.status === 404) {
  // Create collection + attributes → retry document creation
}
```

**Part 2: Fix HomePage upload flow** — Replace `access_token: 'disabled'` with real AppWrite user ID:

```typescript
// ❌ BEFORE (Supabase stub):
const refreshedSession = { access_token: 'disabled', user: { id: 'disabled' } }
const response = await fetch('/api/scan', {
  headers: { 'Authorization': `Bearer ${accessToken}` },
  body: JSON.stringify({ image: base64, userId: refreshedSession.user.id })
})

// ✅ AFTER (real AppWrite auth):
if (!user) throw new Error('Authentication failed — please sign in')
const response = await fetch('/api/scan', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: base64, userId: user.$id })
})
```

**Part 3: Fix ManageCardsView** — Replace independent Supabase-stubbed CRUD with AppWrite Databases calls:

The ManageCardsView often has its OWN `fetchCards`, `handleMergeCard`, and `handleDeleteCard` implementations that are separate from the `useBusinessCards()` hook. Each must be independently migrated:

```typescript
// ❌ BEFORE:
const fetchCards = async () => {
  console.log('[DISABLED] fetchCards: Supabase removed')
  setCards([])
}

// ✅ AFTER:
import { databases, DATABASE_ID, CARDS_COLLECTION } from '@/lib/appwrite'
import { Query } from 'appwrite'

const fetchCards = async () => {
  const response = await databases.listDocuments(
    DATABASE_ID, CARDS_COLLECTION,
    [Query.equal('user_id', user.$id), Query.orderDesc('$createdAt')]
  )
  const mapped = response.documents.map(doc => ({
    id: doc.$id, created_at: doc.$createdAt, /* ... map all fields */
  }))
  setCards(mapped)
}
```

### 🚨 AppWrite Collection Attributes Mismatch — Document Creation Fails

**Symptom**: The scan API deploys successfully, image upload to storage works, but document creation returns `400: Invalid document structure: Unknown attribute: "name_zh"`. The `business_cards` collection exists but doesn't have all the required attributes.

**Root cause**: The collection was created (or already existed) with a minimal set of attributes. Fields like `name_zh`, `title_zh`, `address_zh`, `images`, `mergedFrom`, `mergedInto`, `lastModified` that existed in the old Supabase schema were never added as AppWrite collection attributes.

**How to detect**: The error message explicitly names the missing attribute: `Unknown attribute: "name_zh"`.

**Fix**: Auto-provision attributes in the scan API when collection is created, or add them manually via REST API:

```bash
# Add missing string attribute
curl -s -X POST \
  "https://sgp.cloud.appwrite.io/v1/databases/bizcard_ai/collections/business_cards/attributes/string" \
  -H "X-Appwrite-Key: $KEY" \
  -H "X-Appwrite-Project: 69efa226000db23fcd89" \
  -H "Content-Type: application/json" \
  -d '{"key":"name_zh","type":"string","size":255,"required":false}'
```

**Full attribute checklist for bizcard → AppWrite migration**:
| Attribute | Type | Size | Required |
|---|---|---|---|
| `user_id` | string | 255 | true |
| `name` | string | 255 | false |
| `name_zh` | string | 255 | false |
| `company` | string | 255 | false |
| `company_zh` | string | 255 | false |
| `title` | string | 255 | false |
| `title_zh` | string | 255 | false |
| `email` | string | 255 | false |
| `phone` | string | 255 | false |
| `address` | string | 1000 | false |
| `address_zh` | string | 1000 | false |
| `image_url` | string | 2000 | false |
| `images` | string[] | — | false |
| `notes` | string | 5000 | false |
| `lastModified` | string | 255 | false |
| `mergedFrom` | string[] | — | false |
| `mergedInto` | string | 255 | false |

### 🚨 Image Display Components Still Using Supabase Storage Utilities

**Symptom**: Cards appear in Manage view (count is correct) but images show as broken/placeholder. Console shows `[DISABLED] getImageUrl: Supabase removed`.

**Root cause**: Individual UI components (`CardItem.tsx`, `BusinessCardDetails.tsx`) import `getImageUrl` from `@/lib/supabase-storage`, which is a separate stub from the main `useBusinessCards` hook. The migration focused on auth + data hooks but missed image utility imports in display components.

**How to detect**:
```bash
grep -rn "getImageUrl\|getPublicUrl\|supabase-storage" components/
```

**Fix**: Remove the Supabase storage import and use image URLs directly:
```typescript
// ❌ BEFORE:
import { getImageUrl } from '@/lib/supabase-storage'
const url = await getImageUrl(card.image_url)

// ✅ AFTER:
// If image_url starts with https://, it's already a full URL (AppWrite storage)
if (card.image_url?.startsWith('https://') || card.image_url?.startsWith('http://')) {
  setImageUrl(card.image_url)
} else {
  // Legacy path — use directly as fallback
  setImageUrl(card.image_url)
}
```

**Files commonly affected**: `components/cards/CardItem.tsx`, `components/cards/BusinessCardDetails.tsx`, `components/cards/CardDetailView.tsx`

### 🚨 `appwrite` npm SDK v14 Has No `setKey()` — Use `node-appwrite` or REST API for Server-Side

**Symptom**: Vercel build fails with `Type error: Property 'setKey' does not exist on type 'Client'` when trying to use `new Client().setKey(apiKey)` in an API route.

**Root cause**: The `appwrite` npm package is the **client-side** SDK. It does NOT have `setKey()` for server-side API key authentication.

**Fix — Option A (preferred): Use `node-appwrite` SDK** (has `setKey()`, handles multipart, permissions, auth internally):

```bash
npm install node-appwrite
```

```typescript
// ✅ node-appwrite — full SDK with server-side API key support:
import { Client, Storage, Databases, ID, Permission, Role } from 'node-appwrite'

function getAppWriteClient(): Client {
  return new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('69efa226000db23fcd89')
    .setKey(process.env.APPWRITE_API_KEY || '')
}

// Storage upload — SDK handles multipart/form-data internally:
const storage = new Storage(client)
const file = await storage.createFile(
  STORAGE_BUCKET,
  ID.unique(),
  new File([buffer], fileName, { type: 'image/jpeg' }),
  [Permission.read(Role.user(userId))]
)
const imageUrl = `${ENDPOINT}/storage/buckets/${STORAGE_BUCKET}/files/${file.$id}/view?project=${PROJECT_ID}`
```

**Fix — Option B: Use REST API directly with fetch:**

```typescript
// ✅ CORRECT — use REST API:
const headers = {
  'X-Appwrite-Project': PROJECT_ID,
  'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
  'Content-Type': 'application/json',
}
const res = await fetch(`${ENDPOINT}/databases/${DB}/collections/${COL}/documents`, {
  method: 'POST', headers, body: JSON.stringify({ documentId: '...', data: {...} })
})
```

### 🚨 Raw `https.request` + Buffer Causes `source.on is not a function` (Node.js ≥22)

**Symptom**: Calling `https.request` (or `http.request`) with `.write(buffer)` where buffer is a `Buffer.concat()` of multipart form data body, on Node.js v22+. Error: `TypeError: source.on is not a function`. No stack trace pointing to your code — internal Node.js HTTP handling.

**Root cause**: Node.js v22+ changed how `ClientRequest.write()` handles chunks internally. Non-stream chunks (Buffer, Uint8Array) should be fine, but edge cases with `Buffer.concat()` or specific Content-Type headers trigger a stream-pipe codepath that expects `.on()` on the chunk. This is a Node.js runtime issue, not a code logic error.

**Fix**: Use one of these instead of raw `https.request` with manual multipart:

1. **`node-appwrite` SDK** (best — handles everything internally, see above)
2. **Node.js native `fetch`** with `FormData` (available in Node.js ≥18):
   ```typescript
   const formData = new FormData()
   formData.append('fileId', fileName)
   formData.append('file', new Blob([buffer], { type: 'image/jpeg' }), fileName)
   const res = await fetch(`${ENDPOINT}/storage/buckets/${BUCKET}/files`, {
     method: 'POST',
     headers: { 'X-Appwrite-Project': PROJECT_ID, 'X-Appwrite-Key': API_KEY },
     body: formData,
   })
   ```
3. **File-based approach** — write buffer to temp file, use `fs.createReadStream()` as the request body (streams implement `.on()`).

### 🚨 Vercel Serverless Timeout on Collection Attribute Auto-Provisioning

**Symptom**: Scan API tries to create all 16+ collection attributes in a single cold start (sequential REST calls + 2s delay). Vercel hobby plan has a 10-second timeout — the function times out before attributes are created. Attributes get added one-at-a-time across multiple deployment attempts, making the fix appear intermittent.

**Root cause**: `ensureCollection()` makes multiple sequential `POST /attributes/string` calls with a 2-second propagation delay. On a cold start with no attributes, this easily exceeds Vercel's 10s limit.

**Fix — Minimal fields first**: Only include the 2-3 fields you KNOW exist (`user_id`, `company`, `image_url`). Add remaining attributes later via a dedicated setup endpoint or manual REST API calls.

```typescript
// Minimal document — only guaranteed fields:
const docData = {
  data: {
    user_id: userId,
    company: '',
    image_url: imageUrl,
  }
}
```

Full attribute provisioning is better done as a one-time setup script (`execute_code` with `terminal` + curl to AppWrite REST API), not in every scan API call.

### 🚨 Conflicting Pages Router and App Router API Routes

**Symptom**: Vercel build fails with `Conflicting app and page file was found: "pages/api/scan.ts" - "app/api/scan/route.ts"`.

**Root cause**: The old Supabase-based API route at `pages/api/scan.ts` (or `pages/api/scan.js`) still exists when the new AppWrite-based `app/api/scan/route.ts` is created. Next.js doesn't allow both.

**Fix**: Delete the old Pages Router API files:
```bash
rm pages/api/scan.ts pages/api/scan.js  # if they exist
```

### 🚨 Server-Side OAuth Proxy (Ultimate iOS Safari Fix)

**When to use**: `createOAuth2Token` still fails on iOS Safari because the AppWrite SDK loses auth state across the OAuth redirect chain. Fresh page load → no session in memory/cookies/localStorage → `account.get()` returns 401. The only guaranteed fix is to move the ENTIRE OAuth flow server-side.

**Architecture**:
```
Client → /api/auth/google → Google OAuth → /api/auth/google/callback 
→ exchange code (server-side) → create AppWrite session (server-side) 
→ set first-party cookie on your domain → redirect to app
```

### Step 1: Create `/api/auth/google/route.ts` (Initiates OAuth)

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`
  
  if (!clientId) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 })
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
    prompt: 'consent',
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}
```

### Step 2: Create `/api/auth/google/callback/route.ts` (Handles Callback)

This route exchanges the Google code for tokens, gets user info, creates/finds the AppWrite user, creates a session, and sets a first-party cookie:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(error || 'no_code')}`, request.url)
    )
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
    const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`
    const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
    const appwriteProject = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '69efa226000db23fcd89'
    const appwriteKey = process.env.APPWRITE_API_KEY!

    // 1. Exchange Google code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    })
    const tokens = await tokenRes.json()
    if (!tokenRes.ok) throw new Error(tokens.error_description)

    // 2. Get Google user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const googleUser = await userRes.json()

    // 3. Create/find AppWrite user & create session (first-party cookie on your domain!)
    // ... (REST API calls to AppWrite — see full implementation below)
    
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.set(`a_session_${appwriteProject}`, sessionSecret, {
      httpOnly: false, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
    })
    return response
  } catch (err: any) {
    return NextResponse.redirect(new URL(`/auth/callback?error=${encodeURIComponent(err.message)}`, request.url))
  }
}
```

### Step 3: Update Client-Side `signInWithProvider`

Replace the AppWrite SDK call with a simple redirect to your API route:

```typescript
signInWithProvider: async (provider) => {
  // Server-side OAuth proxy — bypasses iOS Safari third-party cookie blocking
  window.location.href = '/api/auth/google'
  return new Promise(() => {}) // Never resolves — we're navigating away
}
```

### Step 4: Required Environment Variables on Vercel

```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
APPWRITE_API_KEY=standard_xxx     # Server-side API key with users.write, sessions.write
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=69efa226000db23fcd89
```

### Step 5: Google Cloud Console — Add Redirect URI

Add to Authorized redirect URIs:
```
https://bizcardai.vercel.app/api/auth/google/callback
```

### AppWrite REST API for User/Session Management (Server-Side)

**Create user**: `POST /v1/users` with `X-Appwrite-Key` and `X-Appwrite-Project` headers
**Create token**: `POST /v1/users/{userId}/tokens` 
**Create session from token**: `POST /v1/account/sessions/token` with `{userId, secret}`

The session secret returned by the REST API is what you set as the `a_session_{projectId}` cookie. The client-side AppWrite SDK reads this cookie automatically — no code changes needed in the callback page or auth context.

**🔥 Critical**: `redirect_uri` in the Google OAuth URL MUST exactly match what's registered in Google Cloud Console, including the protocol and trailing slash (or lack thereof). A mismatch returns `redirect_uri_mismatch` (error 400).

**Symptom**: The app deploys successfully (build passes, no errors) but visiting the root URL shows "Page not found" from `app/not-found.tsx`. Other routes like `/signin` and `/auth/callback` work fine.

**Root cause**: The app has BOTH `pages/` (Pages Router) and `app/` (App Router) directories, a common Next.js pattern during migration. The main app content lives in `pages/index.tsx`, but the App Router takes priority. Since no `app/page.tsx` exists, Next.js renders the App Router's `not-found.tsx` at the root route.

**How to detect**:
```bash
# Check if app/page.tsx exists
ls app/page.tsx

# List all page.tsx files in app/
find app -name "page.tsx"
```
If `/auth/callback/page.tsx` and `/signin/page.tsx` exist but `app/page.tsx` is missing, this is the issue.

**Fix — Proper approach**:

1. **Extract the component** from `pages/index.tsx` into a shared location (e.g., `components/HomePage.tsx`). Do NOT try to import from `@/pages/index` — Next.js treats `pages/` specially and it won't work as a normal import path. **CRITICAL**: Use `terminal` with Python for file I/O (`python3 << 'PYEOF'`), NOT `read_file` + `write_file`. The `read_file` tool prepends line number prefixes (e.g., `   398|   394|`) that corrupt the written file. If extraction via `terminal` accidentally overwrites the source file, recover it: `cd repo && git show HEAD~1:pages/index.tsx > /tmp/backup.tsx`.
   ```tsx
   // components/HomePage.tsx
   'use client'
   // ... all the original code from pages/index.tsx ...
   export default function HomePage() { ... }
   ```
   - Add `'use client'` directive at the top (the component uses `window`, hooks, and browser APIs)
   - Wrap any `window.location` references in `typeof window !== 'undefined'` checks to prevent SSR crashes
   - ⚠️ Use `terminal` + Python for file I/O (e.g., `python3 << 'PYEOF'`), NOT `read_file`/`write_file` — `read_file` adds line number prefixes that corrupt extracted files
   - **Recovery tip**: If you accidentally overwrite `pages/index.tsx`, recover from git: `git show HEAD~1:pages/index.tsx > /tmp/backup.tsx`

2. **Create `app/page.tsx`**:
   ```tsx
   // app/page.tsx
   import HomePage from '@/components/HomePage'
   export default function Page() { return <HomePage /> }
   ```

3. **Delete `pages/index.tsx`** — Next.js will refuse to build with both `pages/index.tsx` and `app/page.tsx` (conflicting routes).

4. **Fix double-header nesting**: If `app/layout.tsx` wraps `children` in `<Header>` + `<main>`, the extracted `HomePage` (which also renders its own `<Header>` + `<main>`) will produce double headers. Fix by stripping `<Header>` and `<main>` from `app/layout.tsx`, leaving only `<Providers>` + `{children}`. The page component handles its own layout.

**Alternative (minimal change)**: If you can't restructure the layout, add an `embedded?: boolean` prop to the extracted component. When `embedded={true}` (App Router), skip the outer `<div>`, `<Header>`, `<main>`, and `<Footerdemo>`. When `embedded={false}` (default, for Pages Router compatibility), render the full layout.

### 🚨 Supabase Still Loading Despite Zero Imports

**Root cause**: Vercel env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are still set in the Vercel dashboard. Even if no file imports Supabase, Next.js bundles these env vars at build time and the Supabase client auto-initializes. The browser console will show `[Supabase] Creating new client instance` and `GoTrueClient` logs.

**Fix (no Vercel token)**: Neutralize Supabase by mocking the entire client.

### Neutralizing Supabase with a Mock Client

When 20+ files still import `lib/supabase-client.ts` and you need to stop all Supabase activity immediately without editing every file, replace the Supabase client with a complete mock. Cast everything `as any` — TypeScript infers `data: null` and narrows types to `never`. Every method must accept `(..._: any[])` — even `@ts-nocheck` doesn't suppress the implicit `any` rest parameter error. Match the Supabase chaining pattern: `.from().select().eq().not()` returns objects with the right methods. Set `supabaseAdmin` to the same mock object, not `null`. All exported functions must accept any args.

**Why this works**: All 20+ files keep their imports unchanged. The mock returns empty data/noop for every call. The app compiles and runs with zero Supabase activity.

---

### 🚨 Auth Polling Interval Causes Infinite Data Re-Fetch Loop

**Symptom**: After migration, the app works but the page "keeps refreshing itself." Cards flash, the detail dialog keeps closing, and the browser console shows `Total cards in database for user: 0` logged 15-20 times within seconds. The app feels jittery and unusable.

**Root cause — Two interacting issues**:
1. AppWrite has no `onAuthStateChange` equivalent, so the auth context polls `account.get()` every 5 seconds via `setInterval`. Each poll calls `setUser(currentUser)` — which creates a **new object reference** every time, even if the user hasn't changed.
2. The `useBusinessCards` fetch hook depends on `[user]` — a new user reference (even with identical values) creates a new `fetchCards` function, which triggers `useEffect` to re-fetch cards. Each re-fetch sets `setCards(...)`, which re-renders UI elements including open dialogs, causing them to close.

**The cascade**: `setInterval(5000)` → `setUser(newObject)` → `useBusinessCards` re-fetches → `setCards(...)` → re-render → detail dialog closes → user sees empty page

**How to detect**: Browser console shows `Total cards in database for user: 0` logged many more times than expected. Each log is one re-fetch.

**Fix — Two changes**:
1. **Compare user before updating**: Use functional `setState` to check if user actually changed by `$id`:
```typescript
setUser(prev => {
  if (!prev || prev.$id !== (currentUser as AppWriteUser).$id) {
    return currentUser as AppWriteUser
  }
  return prev // Same user — no update needed
})
```
2. **Reduce polling interval** from 5s to 30s — less aggressive, same protection against cross-tab auth changes.

**Also fix `getImageUrl` stubs**: If the migration left a `supabase-storage.ts` stub that always returns `null`, the image won't display AND `imageError` state changes will trigger `useEffect` loops in display components. Replace stubs with pass-through for AppWrite URLs.

**Symptom**: Cards appear in console (e.g., `Total cards in database for user: 2` from `useBusinessCards`) but don't show in the Manage page UI. Console shows `[DISABLED] fetchCards: Supabase removed` from `ManageCardsView`.

**Root cause**: The `ManageCardsView` component has its OWN independent `fetchCards`, `handleMergeCard`, and `handleDeleteCard` implementations — separate from the `useBusinessCards()` hook. The hook was migrated to AppWrite, but the view's own CRUD methods are still Supabase stubs.

**How to detect**:
```bash
grep -rn "DISABLED\|Supabase removed" components/cards/ManageCardsView.tsx
```

**Fix**: Replace ManageCardsView's local methods with direct AppWrite databases calls. Or refactor the view to use the already-migrated `useBusinessCards()` hook.

### 🚨 Supplementary Pages Still Using Supabase After Main Migration

**Symptom**: Core auth + main CRUD (cards, manage) work on AppWrite, but supplementary pages (Companies, News, Network) still show `Not authenticated`, `.from() is not a function`, or `Supabase removed` errors. The `CompanyTrackingContext`, `NewsFeed`, and related server actions/API routes were never touched during migration.

**Root cause — THREE layers of Supabase dependency in supplementary features**:
1. **Client-side context** (`contexts/CompanyTrackingContext.tsx`) imports `useSupabaseClient()` from `@supabase/auth-helpers-react` and makes direct `.from()` calls
2. **Server actions** (`app/actions/company-tracking.ts`) use `createServerComponentClient({ cookies })` and are imported by UI components
3. **API routes** (`app/api/companies/track/route.ts`, `app/api/news/feed/route.ts`) use `createServerComponentClient({ cookies })` for auth + DB

**How to detect**:
```bash
# Find all files still importing Supabase
grep -rn "supabase" --include="*.tsx" --include="*.ts" contexts/ app/actions/ app/api/ components/ | grep -v node_modules | grep -v ".d.ts"
```

**Fix — Three-part strategy**:

**Part 1: Rewrite client-side context to use AppWrite SDK directly**

Replace `useSupabaseClient()` with `databases` from `lib/appwrite`. Add the `getNewsFeed` method directly to the context so components don't need server actions:
```typescript
// ❌ BEFORE:
import { useSupabaseClient } from '@supabase/auth-helpers-react'
const supabase = useSupabaseClient()
const { data } = await supabase.from('tracked_companies').select('*').eq('user_id', user.id)

// ✅ AFTER:
import { databases, DATABASE_ID, ID } from '@/lib/appwrite'
import { Query } from 'appwrite'
const res = await databases.listDocuments(DATABASE_ID, 'tracked_companies', [
  Query.equal('user_id', user.$id), Query.orderDesc('$createdAt')
])
```

Handle missing collections gracefully — wrap each collection query in its own try/catch and show empty state rather than crashing:
```typescript
try {
  const res = await databases.listDocuments(DATABASE_ID, 'tracked_companies', [...])
  dispatch({ type: 'SET_TRACKED_COMPANIES', payload: res.documents.map(mapDoc) })
} catch (e: any) {
  console.log('[Provider] Collection not available:', e?.message)
  dispatch({ type: 'SET_TRACKED_COMPANIES', payload: [] })
}
```

**Part 2: Migrate server actions to deprecation stubs**

Since the client-side context now handles all CRUD, server actions imported by components should be removed and the component should use context methods instead:
```typescript
// ❌ BEFORE (component):
import { trackCompany as trackCompanyAction } from '@/app/actions/company-tracking'
const { data, error } = await trackCompanyAction(newCompany)

// ✅ AFTER (component):
const { trackCompany } = useCompanyTracking()
await trackCompany(newCompany)
```

Convert server actions file to deprecation stubs for backward compatibility:
```typescript
'use server'
// NOTE: Migrated to client-side AppWrite SDK. These stubs remain for any external callers.
export async function getTrackedCompanies() {
  return { data: [], error: 'Server action deprecated — use client-side context' }
}
```

**Part 3: Rewrite API routes to use AppWrite REST API**

Since AppWrite sessions can't be verified server-side (client-only SDK), API routes should accept `user_id` in the request body and use the server-side API key:
```typescript
// ❌ BEFORE:
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
const supabase = createServerComponentClient({ cookies })
const { data: { session } } = await supabase.auth.getSession()

// ✅ AFTER:
const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
function headers() {
  return {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
    'Content-Type': 'application/json',
  }
}
const { user_id, ...data } = await request.json()
const res = await fetch(`${APPWRITE_ENDPOINT}/databases/${DB}/collections/${COL}/documents`, {
  method: 'POST', headers: headers(), body: JSON.stringify({ documentId: id, data: { user_id, ...data } })
})
```

### 🚨 API Key Scope Gap — Cannot Create Collections Programmatically

**Symptom**: The AppWrite REST API returns `401: user_unauthorized` for `GET /databases` or `POST /databases/{id}/collections`, even though the same API key works for storage operations and document CRUD.

**Root cause**: The API key may have `storage.write` and per-document `databases.write` but NOT `databases.read`, `collections.read`, or `collections.write` scopes. These are separate granular scopes in AppWrite.

**How to detect**: Try any collection-level operation with the API key:
```bash
curl -s "https://sgp.cloud.appwrite.io/v1/databases/{DB_ID}/collections" \
  -H "X-Appwrite-Key: $KEY" -H "X-Appwrite-Project: $PROJECT"
# Returns 401 if scopes are missing
```

**Fix**: Go to AppWrite Console → Project → API Keys → edit the key → add these scopes:
- `databases.read` — list databases/collections
- `databases.write` — create databases/collections
- `collections.read` — list collections
- `collections.write` — create collections + attributes

**Workaround without scope update**: Write client-side code to handle missing collections gracefully (catch errors, show empty state, log clear messages). The pages work but show "no data" until collections exist. This avoids blocking deployment while waiting for scope updates.

### 🚨 Graceful Degradation for Missing Collections

**Pattern**: When the API key can't create collections (scope gap), wrap EACH collection's data load in its own try/catch inside the provider's `useEffect`. This prevents one missing collection from blocking data load for others:

```typescript
// ✅ Each collection gets its own try/catch:
try {
  const res = await databases.listDocuments(DATABASE_ID, 'tracked_companies', [...])
  dispatch({ type: 'SET_TRACKED_COMPANIES', payload: res.documents.map(mapDoc) })
} catch (e: any) {
  console.log('[Provider] Collection not available:', e?.message)
  dispatch({ type: 'SET_TRACKED_COMPANIES', payload: [] })  // empty state, no crash
}
```

Also wrap individual document queries (upserts, preferences lookup) the same way — the preference query for a specific company shouldn't crash just because the preferences collection doesn't exist.

### 🚨 Setup Endpoint Pattern — Create Collections from Vercel Build

**When to use**: The local API key lacks `databases.write` / `collections.write` scope, but the Vercel-deployed API key has proper scopes. You need to create AppWrite collections but can't do it locally.

**Pattern**: Create an `/api/setup/route.ts` that uses `process.env.APPWRITE_API_KEY` (available in Vercel's environment) to create collections and attributes. The route auto-runs during `next build` (static generation touches all routes), so collections are provisioned on deploy:

```typescript
// app/api/setup/route.ts
export async function GET() {
  const results: Record<string, string> = {}
  for (const [collId, name, attrs] of COLLECTIONS) {
    // Check if exists, create if not, add attributes
    results[collId] = await createCollectionIfMissing(collId, name, attrs)
  }
  return NextResponse.json({ success: true, results })
}
```

The Vercel build output will show logs like `[Setup] Collection tracked_companies already exists` or `[Setup] Created collection: tracked_companies`. Collections are created once on first deploy and skipped on subsequent deploys.

**Important**: The setup endpoint needs no auth — it uses the server-side API key internally. Don't `export const dynamic = 'force-static'` or it won't run the fetch calls.

### 🚨 Dark Mode + White Dialogs → Invisible Text

**Symptom**: After migration, dialog content (card details, edit forms) appears blank — users report "can't see the words" or "text and background are the same color." The app uses Tailwind dark mode (`.dark` class on `<html>`), but dialogs force `bg-white` for a card-like look in a light section.

**Root cause**: In dark mode, Tailwind's `text-foreground` resolves to light/near-white (`--foreground: 210 40% 98%`). When a `<DialogContent>` has `bg-white`, the inherited text color is white-on-white — completely invisible. This affects any component that forces a light background inside a dark-mode app.

**How to detect**: Check if `.dark` class is present:
```js
document.documentElement.classList.contains('dark') // true = dark mode active
```
Then check dialog backgrounds — if they're `bg-white` without explicit `text-gray-900`, text is invisible.

**Fix — Add explicit text color to white-background elements**:
```tsx
// ❌ Invisible in dark mode:
<DialogContent className="bg-white">
<Card className="bg-white">

// ✅ Visible in both modes:
<DialogContent className="bg-white text-gray-900">
<Card className="bg-white text-gray-900">
```

**Files commonly affected**: `CardDetailView.tsx`, `BusinessCardDialog.tsx`, `BusinessCardDetails.tsx`, any dialog or card component that forces `bg-white`.

### 🔍 Post-Migration Verification: Full Page-by-Page Audit

**After migration, audit ALL pages — not just the ones you touched.** Stale Supabase stubs often hide in components that weren't part of the main migration (e.g., `CompanyTrackingProvider`, `NewsFeed`, `NetworkView`). Use a subagent with browser tools to check every page systematically:

1. Navigate to each page URL (signed in)
2. Check browser console for: `[DISABLED]`, `Supabase removed`, `401`, `AppwriteException`, `.from() is not a function`
3. Verify UI renders correctly (cards, images, data)
4. Report status: ✅ WORKING / ⚠️ PARTIAL / ❌ BROKEN with specific errors

**Recommended audit URLs** (adapt to your app):
- `/` or `/?tab=scan` — Upload flow
- `/?tab=manage` — Card list + images
- `/?tab=network` — Organization chart
- `/companies` — Company tracking
- `/?tab=news` — News feed
- `/intel` — Intel/headlines
- `/?tab=settings` — Subscription + usage
- `/?tab=pricing` — Plans

Typical pattern: Auth + core CRUD pages work after migration, but supplementary pages (Companies, News, Network) that import `CompanyTrackingProvider` or Supabase client directly remain broken.

### 🚨 `useAuth` Import Conflict When `useBusinessCards` Already Calls `useAuth`

**Symptom**: Webpack build fails with `'useAuth' redefined here` when a component imports both `useBusinessCards` (from `@/lib/hooks/useBusinessCards`) and `useAuth` (from `@/lib/auth-context`). The `useBusinessCards` hook internally calls `useAuth()`, and the component also calls `useAuth()` — webpack sees two symbols named `useAuth` from the same module path and refuses to compile.

**Root cause**: The component needs the `user` object for upload flows (`user.$id`), so the developer adds `const { user } = useAuth()`. But `useBusinessCards()` already imports and calls `useAuth()` internally. Even though React allows multiple `useAuth()` calls, webpack's dependency analysis treats the second import as a conflict.

**Fix — Export `user` from `useBusinessCards`** (avoids importing `useAuth` separately):
```typescript
// In useBusinessCards.ts:
return {
  cards, loading, error, addCard, updateCard, deleteCard,
  refresh: fetchCards,
  user,  // ← export the user from the hook
}

// In the component — get user from useBusinessCards, no separate useAuth needed:
const { cards, user } = useBusinessCards()
// user.$id is now available for upload flows
```

**Important**: Make sure the component file removes any standalone `import { useAuth } from '@/lib/auth-context'` and `const { user } = useAuth()` — if both remain, the conflict persists.

### 🚨 AppWrite Schema Validation — String Field Exceeds Max Length

**Symptom**: OCR succeeds, image upload works, but document creation fails with `400: Invalid document structure: Attribute "phone" has invalid type. Value must be a valid string and no longer than 50 chars`. The field value looks like 50 chars on screen but has invisible whitespace or newlines.

**Root cause**: OCR output often includes multi-line phone data with hidden `\n`, `\r`, or trailing spaces. E.g., `DIRECT: (852) 2113 2369, MOBILE: (852) 9778 9792, TEL: (852) 2525 2318, FAX: (852) 2328 6381` — `.substring(0, 50)` preserves invisible characters, so AppWrite's schema validation rejects it even though the visible length looks correct.

**Fix — Sanitize before truncate**:
```typescript
// ❌ BROKEN — preserves hidden whitespace/newlines:
phone: (ocrResult.phone || '').substring(0, 50)

// ✅ Sanitize whitespace first, then truncate:
phone: (ocrResult.phone || '').replace(/\s+/g, ' ').trim().substring(0, 50)
```

**Pattern for all string fields with max length constraints**:
```typescript
function sanitizeField(value: string | undefined, maxLength: number): string {
  return (value || '').replace(/\s+/g, ' ').trim().substring(0, maxLength)
}
```

**Affected fields**: `phone` (50), `name` (255), `company` (255), `title` (255), `email` (255), `address` (1000). Any field where OCR or user input may contain multi-line text, hidden characters, or unicode whitespace.

### 🚨 Third-Party API Dependencies Mask Migration Success

**Symptom**: After migration, the scan/upload flow fails. The error looks like it might be a migration issue (Supabase gone, AppWrite not working), but the actual cause is an external API dependency that's exhausted or disabled.

**Example**: The OCR step in the scan pipeline calls Together AI (`api.together.xyz`). If credits are exhausted (`402 Credit limit exceeded`), the entire pipeline fails BEFORE reaching the AppWrite storage/database steps. The error surfaces as a generic "Failed to process business card" rather than "Together AI credit exceeded."

**How to detect**:
1. Test each pipeline step individually: `/api/ocr` → `/api/scan` (with the OCR result mocked) → storage → database
2. Check the response from intermediate API calls — the error message often contains the real root cause buried in nested JSON
3. Test each external API key independently to confirm it's active

**Fix**: Separate the OCR/processing step from the storage+save step. Even if OCR fails, save the card image with empty fields so users can see it in Manage view and manually edit:
```typescript
// In scan route: try OCR, but continue regardless
let ocrResult = { name: {}, company: {}, /* ... empty defaults */ }
try {
  ocrResult = await callOCR(image)
} catch (e) {
  console.warn('[SCAN] OCR failed, saving card without extracted data:', e.message)
}
// Always upload + save, even if OCR failed
await uploadImage(userId, image)
await saveCard(userId, ocrResult, imageUrl)
```

After build passes:
1. `git add -A` (exclude `tsconfig.tsbuildinfo` — add to `.gitignore` if missing)
2. `git commit -m "feat: migrate auth and business cards from Supabase to AppWrite"`
3. `git push origin main` — if HTTPS remote fails with "could not read Username", load the `github-auth` skill to set up a PAT token. Use `git remote -v` to check whether the remote is HTTPS or SSH.
4. **Verify the deployed app** uses the correct config. Open the deployed URL in a browser (or use `browser_navigate`) and check the console with `browser_console`:
   - Look for `[AuthContext] Redirecting to OAuth: https://EXPECTED_REGION.cloud.appwrite.io/...`
   - If the OAuth URL shows the wrong region/project, Vercel env vars are overriding code defaults. See pitfall above.<｜end▁of▁thinking｜>

---

## Subagent Strategy

For large migrations, dispatch subagents in parallel:
- **Auth subagent**: `lib/auth-context.tsx` + `components/auth/OAuthCallback.tsx`
- **DB subagent**: `lib/hooks/useBusinessCards.ts` + related CRUD files

Provide each subagent with the full AppWrite API reference and the key differences table above. After they complete, run the build-fix cycle in the parent session to catch type errors the subagents missed.
