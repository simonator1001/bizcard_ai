# BizCard AI — Dogfood QA Audit Source

## App Info
- **App:** BizCard AI
- **URL:** https://bizcardai.vercel.app
- **Stack:** Next.js 14, AppWrite, Tailwind CSS, Shadcn UI
- **Date:** 2026-04-29

## Audit Results

### CSS Design System
- `--muted`: changed from `340 82% 77%` (pink) → `240 5% 88%` (gray)
- `--secondary`: changed from `291 64% 65%` (purple) → `263 70% 60%` (violet)
- `--primary`: changed from `252 95% 67%` (blue) → `243 75% 59%` (indigo)
- Body background gradient: purple → indigo/violet

### Pages Tested (7/7 pass)
1. Home (Scan tab) — 0 JS errors
2. My Card tab — 0 JS errors
3. Contacts tab — 0 JS errors
4. Sign In — 0 JS errors
5. Sign Up — 0 JS errors
6. Forgot Password — 0 JS errors
7. Share page — 0 JS errors

### Bugs Fixed (5)
1. Tab indicator off-scale: `absolute` missing `relative` parent → indicator floating
2. CSS `--muted` variable: pink → gray (affected ALL shadcn components)
3. CSS `--secondary` variable: purple → violet
4. `safe-area-bottom` Tailwind class: doesn't exist → `env(safe-area-inset-bottom)`
5. Toolbar view mode colors: fuchsia → indigo

### Issues Remaining (1)
- Page title still says "Simon.AI BizCard Digital Archive" (should be "BizCard")

### API Tests (3/3 pass)
- Valid scan: HTTP 200, all 6 fields correct
- Bad request: HTTP 400 (correctly rejected)
- Health check: HTTP 200

### Known Limitations
- 32 secondary page files still have old pink/purple colors (pricing, settings, subscriptions, auth screens)
- Vision tool unavailable with current model — visual regression not tested
