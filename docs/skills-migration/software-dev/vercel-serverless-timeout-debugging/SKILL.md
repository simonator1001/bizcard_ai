---
name: vercel-serverless-timeout-debugging
description: Diagnose and fix Vercel 502 timeout errors in Next.js API routes — API-to-API HTTP chaining, serverless function 10s limit, and long-running operations like AI/OCR calls.
---
# Vercel Serverless Timeout Debugging (502 Errors)

## When to Use

- API route returns 502 with no useful error body (blank or truncated)
- Upload/processing endpoint hangs forever — no response, no error
- Serverless function calls another API route via HTTP within the same deployment
- Long-running operations (AI/OCR/LLM calls via OpenRouter, OpenAI, etc.) exceed Vercel's timeout
- `maxDuration: 60` in `config` doesn't help on Hobby plan (hard 10s limit)
- Client-side fetch to API route has no timeout — UI appears "stuck" forever

## Root Cause Pattern

```typescript
// ❌ BROKEN: POST /api/scan calls /api/ocr via HTTP
// Both are serverless functions on same Vercel deployment
// Each has 10s Hobby timeout → double timeout risk
// OCR via OpenRouter takes 15-30s → guaranteed 502
export default async function handler(req, res) {
  const origin = req.headers.origin || `https://${req.headers.host}`;
  const ocrResponse = await fetch(`${origin}/api/ocr`, {  // ← HTTP call to self
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  });
  // ↑ This HTTP call creates a NEW serverless function invocation
  //   Both functions share 10s budget independently
  //   If /api/ocr takes 15s → /api/scan gets no response → 502
}
```

## Fix: Inline the Cross-Route Call

```typescript
// ✅ FIXED: Import and call the function directly
import { recognizeBusinessCard } from '@/lib/ocr-service';

export default async function handler(req, res) {
  // Direct function call — same process, shares one timeout budget
  const ocrResult = await recognizeBusinessCard(image);
  // Total budget: 10s (Hobby) for the entire function including OCR
}
```

**Why this works**: A single serverless function invocation gets one timeout budget. Inlining the OCR call means the OpenRouter HTTP call happens within the SAME function — no second function spin-up, no extra cold start, no separate timeout.

**Trade-off**: If OCR takes 30s and you're on Hobby (10s limit), you'll still timeout. For that case:
- Upgrade to Pro plan (60s default, configurable up to 900s)
- Or use a background job pattern (return immediately, process async, poll for results)

## Client-Side: Add AbortController Timeout

Even if the server times out, the client should handle it gracefully:

```typescript
// ❌ BROKEN: Infinite wait — UI stuck forever on server timeout
const response = await fetch('/api/scan', {
  method: 'POST',
  body: JSON.stringify({ image, userId }),
});

// ✅ FIXED: AbortController with timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s

const response = await fetch('/api/scan', {
  method: 'POST',
  body: JSON.stringify({ image, userId }),
  signal: controller.signal,
});
clearTimeout(timeoutId);
```

## Vercel Timeout Limits by Plan

| Plan | Default | Max Configurable |
|------|---------|-----------------|
| Hobby | 10s | 10s (cannot increase) |
| Pro | 15s | 300s (5 min) |
| Enterprise | 15s | 900s (15 min) |

## Diagnosis Steps

1. **Test the API route directly with curl** — check if it returns proper error or raw 502:
   ```bash
   curl -s -w "\nHTTP:%{http_code}" -X POST https://example.vercel.app/api/scan \
     -H "Content-Type: application/json" \
     -d '{"image":"data:..."}' --max-time 30
   ```

2. **Check for HTTP chaining in server-side code** — grep for `fetch(`${origin}` or `fetch(\`https://`:
   ```bash
   grep -n "fetch.*origin\|fetch.*https://" pages/api/*.ts
   ```

3. **Check Vercel function logs** — look for timeout messages (not always visible in free tier):
   ```bash
   npx vercel logs --token $TOKEN
   ```

## Common Pitfalls

- **HTTP chaining between routes is invisible**: It looks like normal code but creates separate serverless invocations with independent timeout budgets
- **`maxDuration` in Next.js config does NOT work on Hobby plan**: The config is accepted but silently capped at 10s
- **502 means the function died before responding**: Unlike 504 (gateway timeout), 502 means the function process was killed — often due to hard timeout
- **Vercel cold starts add 1-3s**: Factor this into your timeout calculations
- **Inlined imports must be statically resolvable**: Dynamic `import()` works but `require()` may not in certain Next.js configs

## Verification Checklist

- [ ] Direct curl to API route returns proper response (not raw 502)
- [ ] No remaining `fetch()` calls to same-origin API routes in server code
- [ ] Client-side fetch has AbortController timeout
- [ ] `npm run build` passes with inlined imports
- [ ] Test with actual upload on deployed app (not just curl)
