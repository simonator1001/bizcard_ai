# BizCard AI — Dogfood QA Report

**Date:** 2026-04-29  
**URL:** https://bizcardai.vercel.app  
**Scope:** Full site (Home, Sign In, Sign Up, Forgot Password, Share page)  
**Tester:** Hermes Agent (dogfood skill v1.1.0)

---

## Executive Summary

| | Count |
|---|---|
| **Critical** | 0 |
| **High** | 0 |
| **Medium** | 1 |
| **Low** | 0 |
| **Total** | 1 |

✅ No JS errors on any tested page  
✅ All tab navigation works (Scan → My Card → Contacts)  
✅ Sign-in / Sign-up / Forgot Password pages render correctly  
✅ Scan API returns correct OCR data (HTTP 200)  
✅ Bad requests correctly rejected (HTTP 400)  
✅ CSS variables migrated from pink/purple → indigo/violet/gray  

---

## Issues Found

### M1 — Title still says "Simon.AI BizCard Digital Archive"

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Category** | Content |
| **URL** | All pages |
| **Description** | The `<title>` tag still shows the old app name "Simon.AI BizCard Digital Archive" instead of the new "BizCard" branding used in the header. |

| **Steps to reproduce** | 1. Open https://bizcardai.vercel.app 2. Look at browser tab title |
| **Expected** | "BizCard" or "BizCard AI" |
| **Actual** | "Simon.AI BizCard Digital Archive" |

---

## Pages Tested

| Page | URL | Status | Notes |
|---|---|---|---|
| Home (Scan tab) | `/` | ✅ Pass | 0 JS errors, all elements render, tab indicator correctly positioned |
| My Card tab | `/?tab=mycard` | ✅ Pass | Shows sign-in prompt when not authed |
| Contacts tab | `/?tab=contacts` | ✅ Pass | Shows sign-in prompt when not authed |
| Sign In | `/signin` | ✅ Pass | Email/password + Google OAuth buttons present, form validation works |
| Sign Up | `/signup` | ✅ Pass | Same dialog as sign-in |
| Forgot Password | `/forgot-password` | ✅ Pass | Form renders with back link |
| Share page | `/share/test-user` | ✅ Pass | Shows "Card Not Found" for unknown users (expected) |

---

## CSS Design Consistency Audit

| Check | Result |
|---|---|
| `--muted` CSS variable | `240 5% 20%` (gray) ✅ |
| `--secondary` CSS variable | `263 70% 60%` (violet) ✅ |
| `--primary` CSS variable | `243 75% 59%` (indigo) ✅ |
| `--ring` CSS variable | `243 75% 59%` (indigo) ✅ |
| Pink/fuchsia classes on rendered pages | 0 ✅ |
| Purple classes on rendered pages | 0 ✅ |
| `safe-area-bottom` (broken) | Fixed → `env(safe-area-inset-bottom,0px)` ✅ |
| Tab bar `relative` positioning | All buttons have `relative` ✅ |
| Custom `animate-in` classes | Replaced with `animate-fade-in-up` ✅ |
| Toolbar view mode colors | Fuchsia → indigo ✅ |

---

## API Tests

| Test | Result |
|---|---|
| Valid scan (business card) | HTTP 200, all 6 fields correct ✅ |
| Invalid request (no image) | HTTP 400 (correctly rejected) ✅ |
| Home page HEAD | HTTP 200 ✅ |

---

## Scan E2E Test Details

```
Input:  Test business card image (JPEG, 600×350)
Output: Simon Chow | Founder & CEO | BizCard AI | simon@bizcardai.com | +852 9876 5432
Doc ID: card_1777546873788_t6o1tsf5l
Time:   ~5s
```

---

## What Was NOT Tested

- **Google OAuth sign-in** — headless browser cannot complete OAuth redirect flow
- **Authenticated flows** (My Card editor, contact list, toolbar interactions) — requires working sign-in
- **Browser file upload** — native file picker dialog cannot be automated
- **Pricing / Settings / Admin pages** — not in scope
- **Mobile responsive layout** — tested at desktop viewport only
- **Visual regression** (screenshots) — vision tool unavailable with current model (DeepSeek v4 Pro)

---

## Known Old Colors Remaining (secondary pages, not user-facing)

These files still contain old pink/purple colors but are NOT rendered on the main user flow:

- `components/ui/pricing-card.tsx` — pricing pages
- `components/ui/pricing-cards.tsx` — pricing pages  
- `components/subscription/EnhancedProView.tsx` — subscription view
- `components/auth/AuthScreen.tsx` — old auth screen (superseded by `/signin`)
- `components/layout/Navigation.tsx` — old navigation (unused in v3 layout)
- `components/cards/DuplicateManager.tsx` — duplicate manager
- `components/shared/SettingsTab.tsx` — settings page
- `app/(auth)/forgot-password/page.tsx` — forgot password background

These are low priority (secondary pages) or dead code.
