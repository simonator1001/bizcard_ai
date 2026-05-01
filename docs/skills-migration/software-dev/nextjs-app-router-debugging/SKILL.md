---
name: nextjs-app-router-debugging
description: Diagnose and fix Next.js App Router client-side navigation/reactivity bugs — tab switching doesn't respond, query params change but UI stays stale, same-page Link navigation fails to re-render, useSearchParams requires Suspense.
---

# Next.js App Router Debugging

## When to Use

- User reports tab/content switching doesn't work on a Next.js App Router page
- Clicking nav links changes the URL (`/?tab=X`) but the page content stays the same
- Same-page `<Link>` navigation to `/?param=new` silently fails to update the UI
- `useEffect([], ...)` only fires once and never re-runs on client-side navigation
- Build fails with `useSearchParams() should be wrapped in a suspense boundary`

## Root Cause Pattern

```tsx
// ❌ BROKEN: useEffect with [] deps only runs on mount
// Same-page <Link> to /?tab=manage triggers client-side navigation
// but component stays mounted → effect never re-runs → stale UI
useEffect(() => {
  const tab = new URLSearchParams(window.location.search).get('tab');
  if (tab) setActiveTab(tab);
}, []);
```

```tsx
// ✅ FIXED: useSearchParams() is reactive — re-runs on every param change
const searchParams = useSearchParams();

useEffect(() => {
  const tab = searchParams?.get('tab');
  if (tab) setActiveTab(tab);
}, [searchParams]);
```

## Fix Steps

### Step 1: Replace mount-only useEffect with useSearchParams

In the page/component that reads `?tab=` or `?param=`:

```tsx
import { useRouter, useSearchParams } from 'next/navigation';

export default function MyPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('default');

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);
  // ...
}
```

**Key:** Use optional chaining `searchParams?.get()` — `useSearchParams()` can return `null` during SSR.

### Step 2: Add Suspense boundary in the parent

`useSearchParams()` requires a `<Suspense>` boundary somewhere in the parent tree. Without it, Next.js throws a build-time or runtime error.

```tsx
// app/page.tsx
import { Suspense } from 'react';
import HomePage from '@/components/HomePage';

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>}>
      <HomePage />
    </Suspense>
  );
}
```

### Step 3: Verify with browser tools

```js
// browser_console — verify URL param & content match
JSON.stringify({
  url: window.location.href,
  tab: new URLSearchParams(window.location.search).get('tab'),
  content: document.querySelector('main')?.textContent?.substring(0, 100)
})
```

Then click each nav link with `browser_click` and re-check. Tab should change with URL.

## Alternative: Use Tabs onValueChange with router.push

If you want two-way sync (tab click → URL, URL → tab):

```tsx
const handleTabChange = (tab: string) => {
  setActiveTab(tab);
  router.push(`/?tab=${tab}`);  // push, not replace — enables back button
};

// In Tabs:
<Tabs value={activeTab} onValueChange={handleTabChange}>
```

## Post-Login "Not Found" (Missing Root Page)

If the app has nav links to `/?tab=manage`, `/?tab=network`, etc., but Google/OAuth login redirects to `/` and shows "Not Found":

**Check:** Does `app/page.tsx` exist? If not, the root route has no handler and Next.js returns 404.

```bash
ls app/page.tsx  # Does it exist?
```

**Fix:** Create `app/page.tsx` as a client component with `useSearchParams()` + `Suspense` to route between tabs.

**Related:** If the auth callback also fails, verify the BaaS endpoint and project ID match the actual project:
- AppWrite: endpoint should match project region (e.g., `sgp.cloud.appwrite.io` not `fra.cloud.appwrite.io`)
- Project ID must be the correct one for the deployed app
- Check `.env.local` AND code defaults (they fall through if env var is missing)
- **Search ALL files** with hardcoded AppWrite config — projects often duplicate defaults in multiple places (e.g., `lib/appwrite.ts`, `app/(auth)/callback/page.tsx`, `lib/auth-context.tsx`). Use `search_files` to find every occurrence of the endpoint/project ID constants

## BaaS OAuth Configuration Debugging

When login works on one deploy but not another, or the user reports "not found" after Google sign-in, check the OAuth pipeline end-to-end in three layers:

### Layer 1: OAuth URL Construction

```tsx
// ❌ WRONG: Project ID in URL path — AppWrite returns 404
const authUrl = `${ENDPOINT}/account/sessions/oauth2/${provider}/${PROJECT_ID}?success=...`

// ✅ CORRECT: Project ID as query param
const authUrl = `${ENDPOINT}/account/sessions/oauth2/${provider}?success=...&failure=...&project=${PROJECT_ID}`
```

**Better: Use the AppWrite SDK method instead of manual URL construction:**

```tsx
import { OAuthProvider } from 'appwrite';

// ✅ SDK handles URL format, session creation, and callback parsing
accountService.createOAuth2Session(
  OAuthProvider.Google,  // v24+ requires enum, NOT string 'google'
  callbackUrl,
  callbackUrl,
);
```

⚠️ **AppWrite v24 breaking change:** `createOAuth2Session` requires `OAuthProvider.Google` (enum) — passing the string `'google'` causes a TypeScript build error `Argument of type 'string' is not assignable to parameter of type 'OAuthProvider'`.

**How to detect:** Open the deployed app in the browser, click "Sign in with Google", then use `browser_console(expression='window.location.href')` to capture the redirect URL before the browser leaves the page. If the URL contains `/google/PROJECT_ID` (project ID in path), it's wrong.

### Layer 2: Endpoint Region Mismatch

BaaS projects are region-scoped. Using the wrong regional endpoint (e.g., `fra.cloud.appwrite.io` for a Singapore project) returns 404.

**How to detect:** 
1. Check memory/session history for the project's region (e.g., "all Singapore sgp")
2. Verify the endpoint in `.env.local` and code defaults match the project region
3. Test the OAuth URL directly in the browser: `browser_navigate(url)` and check if it returns "Not Found" vs a useful error like "Invalid success param: Register your new client"

**Action:** If the test shows "Not Found", the project doesn't exist at that endpoint. Try the correct regional endpoint (`sgp.cloud.appwrite.io` etc.).

### Layer 3: Domain Registration

Once the endpoint and project ID are correct, the OAuth server may return: **"Register your new client (DOMAIN) as a new Web platform"**. This means the deployed domain isn't whitelisted in the BaaS project console.

**How to detect:** Navigate to the OAuth URL with the correct format and check the error message with `browser_snapshot(full=true)`.

**Action:** 
- Either add the domain in the BaaS console (requires admin access)
- Or set `NEXT_PUBLIC_SITE_URL` to a domain that IS registered, so the callback URL uses the registered domain instead of `window.location.origin`

```bash
# In .env.local
NEXT_PUBLIC_SITE_URL=https://registered-domain.com
```

```tsx
// In auth-context.tsx, prefer SITE_URL over window.location.origin
const returnUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
const callbackUrl = `${returnUrl}/callback`;
```

### Layer 4: Cross-Origin Callback Session Detection\n\n**Even when Layers 1-3 are correct** (URL format, endpoint, domain registration), the callback page may still fail — `account.get()` returns 401 and the user is redirected back to sign-in.\n\n**Root cause:** The AppWrite SDK's `account.get()` makes a cross-origin request to the AppWrite domain. The session cookie (set by AppWrite during OAuth on its own domain) may not be included in the request due to:\n- `SameSite` cookie restrictions (AppWrite may set `SameSite=Lax` not `SameSite=None; Secure`)\n- The SDK's internal `fetch` may not use `credentials: 'include'` for cross-origin requests\n\n**Detection:** Replace the callback page's `account.get()` with a direct `fetch` that explicitly includes credentials:\n\n```tsx\n// Diagnostic callback page — shows what AppWrite returns\nconst APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';  // must match OAuth endpoint\nconst APPWRITE_PROJECT_ID = '69efa226000db23fcd89';           // must match OAuth project\n\nconst res = await fetch(`${APPWRITE_ENDPOINT}/account`, {\n  method: 'GET',\n  headers: {\n    'X-Appwrite-Project': APPWRITE_PROJECT_ID,\n    'Content-Type': 'application/json',\n  },\n  credentials: 'include',  // ← KEY: include cookies from AppWrite domain\n});\n\nif (res.ok) {\n  const user = await res.json();\n  // Store user in localStorage as fallback, then redirect\n  localStorage.setItem('bizcard_user', JSON.stringify({\n    $id: user.$id, name: user.name, email: user.email,\n  }));\n  window.location.replace('/');  // full reload — see \"OAuth Callback: Force Full Page Reload\" above\n} else {\n  // Show the error on-screen for debugging before redirecting\n  const error = await res.json();\n  // Log or display: error.code, error.message\n  setTimeout(() => window.location.replace('/signin?error=auth_failed'), 3000);\n}\n```\n\n**If `fetch` with `credentials:'include'` succeeds** where `account.get()` failed: the AppWrite SDK is not sending cookies cross-origin. The fetch approach is a reliable workaround.\n\n**If it still fails:** Check the browser console for CORS errors. The AppWrite project must allow the deployed origin in its CORS/web platform settings. Also verify the session cookie is actually set — check browser DevTools → Application → Cookies → `sgp.cloud.appwrite.io`.\n\n### End-to-End Verification

After fixing, verify the full OAuth pipeline in the deployed build:

1. `browser_navigate("https://your-app.vercel.app")` — home page loads without 404
2. Click "Sign In" → click "Sign in with Google"
3. `browser_console(expression='window.location.href')` — should be `accounts.google.com` (Google login page), NOT an AppWrite error page
4. If you see the Google sign-in page, the OAuth pipeline is correctly configured

**Note:** You can't complete the full OAuth flow without real credentials, but reaching `accounts.google.com` confirms all three layers (URL format, endpoint, domain registration) are correct.

**Troubleshooting clicks that don't trigger:** If `browser_click(ref='@e2')` doesn't trigger the expected handler:

1. **Check for duplicate elements**: The UI may have multiple dialogs/pages rendered simultaneously (e.g., homepage dialog + `/signin` page). Two \"Sign in with Google\" buttons may exist with different refs.
2. **Verify with JS**: Use `browser_console(expression='...')` to find and click the visible button:
   ```js
   var btns = document.querySelectorAll('button');
   var gBtn = Array.from(btns).find(b => b.textContent.includes('Sign in with Google') && b.offsetParent !== null);
   if (gBtn) gBtn.click();
   ```
3. **Check the console**: Look for log messages like \"Starting Google sign in\" or auth debug logs to confirm the handler fired. If no log appears, the click targeted the wrong button or was intercepted by an overlay/animation component.

## Common Pitfalls

- **`useSearchParams()` returns `null` during SSR** → always use `searchParams?.get()`
- **Suspense boundary is required** → not adding it causes a cryptic build error
- **`router.push` vs `<Link>`**: Both work with `useSearchParams()`, but `<Link>` is more accessible (right-click, open in new tab)
- **`window.location.search`**: Don't read from `window` in effects — use `useSearchParams()` instead, it works with React's batching
- **Dedup check**: If `read_file` says "file unchanged since last read", use `terminal cat` to get fresh content before patching

## OAuth Callback: Force Full Page Reload

After creating a session in an OAuth callback page (e.g., `/auth/callback`), **never use `router.replace('/')` or `router.push('/')` to redirect to the homepage.** Next.js soft navigation keeps the layout mounted, so the `AuthProvider` (which lives in `layout.tsx`) never re-initializes. The auth context stays stale and shows the user as not signed in.

```tsx
// ❌ BROKEN: Next.js soft navigation — layout AuthProvider stays mounted
await account.createSession(userId, secret);
setTimeout(() => router.replace('/'), 800);

// ✅ FIXED: Full page reload forces AuthProvider to re-initialize
await account.createSession(userId, secret);
setTimeout(() => window.location.replace('/'), 800);
```

**Root cause:** The `AuthProvider` is in `app/layout.tsx` and only runs `account.get()` during its mount effect. Client-side navigation between pages never unmounts the layout, so the provider never re-checks for the newly created session. A full page reload `window.location.replace('/')` is the simplest reliable fix.

This applies to any layout-level context/provider that needs to detect a session created on a different route — not just auth. The same issue occurs with any provider that initializes state once on mount.

## Verification Checklist

- [ ] Each nav link changes both URL and page content
- [ ] Browser back button restores previous tab
- [ ] Direct URL load (`/?tab=manage`) shows correct content
- [ ] `npm run build` passes without useSearchParams/Suspense errors
- [ ] OAuth sign-in completes and shows logged-in state without manual refresh
