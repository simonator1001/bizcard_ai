---
name: browser-async-deadlock-debugging
description: Diagnose stuck/hung frontend async operations caused by JavaScript promise deadlocks — FileReader, Image.onload, and other event-based browser APIs incorrectly wrapped causing infinite hang.
---

# Browser Async Deadlock Debugging

## When to Use

- User reports "stuck at processing", "spinning forever", "never progresses" after a file upload, image load, or any async browser operation
- A progress indicator (spinner, progress bar) appears and never completes — no error, no success, just hangs
- The operation involves `FileReader`, `Image`, `Audio`, or any browser API that uses event listeners (`onload`, `onerror`) wrapped in a Promise
- `Promise` wrapping an event-based API — always suspect the placement of the call that triggers the event

## Root Cause Pattern

Event-based browser APIs require the triggering call (e.g., `reader.readAsDataURL(file)`) to be placed **inside** the Promise executor. If it's called **after** the `await`, the Promise never resolves because the event never fires.

```js
// ❌ BROKEN: readAsDataURL() called AFTER await — Promise hangs forever
const reader = new FileReader();
const base64 = await new Promise((resolve, reject) => {
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
});                                          // ← awaits forever: nothing started reading
reader.readAsDataURL(file);                  // ← never reached!

// ✅ FIXED: readAsDataURL() called INSIDE the Promise executor
const reader = new FileReader();
const base64 = await new Promise((resolve, reject) => {
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);               // ← triggers the read → onload fires → resolves
});
```

## Same Pattern Across All Event-Based APIs

```js
// ❌ Image loading — .src set after await
const img = new Image();
await new Promise((resolve, reject) => {
  img.onload = resolve;
  img.onerror = reject;
});
img.src = url;  // NEVER reached!

// ✅ Image loading — .src set inside
const img = new Image();
await new Promise((resolve, reject) => {
  img.onload = resolve;
  img.onerror = reject;
  img.src = url;
});

// ❌ setTimeout polling — condition checked after await
await new Promise(resolve => {
  // empty executor, no polling logic
});
if (checkCondition()) resolve();  // NEVER reached!

// ✅ setTimeout polling — condition checked inside
await new Promise(resolve => {
  const poll = () => {
    if (checkCondition()) resolve();
    else setTimeout(poll, 100);
  };
  poll();
});
```

## Investigation Steps

### Step 1: Identify where the UI gets stuck

Look for the loading state — which `setUploadProgress()` / `setIsLoading()` call is the last to fire before the hang. That's the operation that starts but never completes.

**Key clue**: If the progress text shows a specific label (e.g., "Processing...") and freezes there — never reaching the next label (e.g., "Scanning...") — the deadlock is in the code block **between** those two `setUploadProgress()` calls. The gap between progress labels pinpoints the exact deadlock location.

### Step 2: Find the Promise wrapping

Search for `new Promise` near the stuck code. Check if the operation that triggers the event is inside or outside the executor function.

### Step 3: Trace control flow

Ask: "What call triggers the event that resolves this Promise?" If that call is after (not inside) the `new Promise(...)` executor, it's the deadlock.

### Step 4: Fix by moving the trigger inside

Move `reader.readAsDataURL()`, `img.src = ...`, etc. into the Promise executor, before the closing `})`.

## Verification

After fixing, test end-to-end:

1. **Deploy** the fix (don't just test locally — Vercel builds can surface issues local dev doesn't)
2. Test the deployed API endpoint with `curl` or a Python script to confirm the full pipeline (OCR → storage → DB) works
3. Trigger the upload/operation in the browser
4. Verify the progress bar completes
5. Verify the next state transitions (preview card, success toast, etc.)
6. Verify error path still works (intentionally break it and check error toast appears)
7. Check browser console for JS errors on both success and error paths

**Never** tell the user "fixed" without completing deployment + API verification + browser testing. Users hate being told something works when it doesn't.

## Common Pitfalls

- **Correct structure but wrong order**: `readAsDataURL` is inside the executor but called BEFORE `onload` is set — still deadlocks (race condition: read completes before handler is attached)
- **One-time events**: `onload` fires once per read. Calling `readAsDataURL()` multiple times on the same FileReader without creating a new instance won't work
- **Copy-paste hazard**: Developers often copy the `new Promise(...)` wrapper pattern but forget to move the trigger inside
- **`await` blindness**: The `await` keyword makes it easy to miss that code AFTER it is never reached if the Promise doesn't resolve
