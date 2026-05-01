---
name: ui-contrast-fix
description: Fix low-contrast UI elements that blend into backgrounds — when user says elements are invisible/hard to see.
---

# UI Contrast Fix Pattern

## Anti-Pattern (DO NOT DO)

When a user says an element is "still invisible" or "white blending into background" after a previous fix, the #1 mistake is making **INCREMENTAL, TRANSLUCENT changes**:

- ❌ `opacity-50`, `opacity-25`, `opacity-20` — always invisible on dark backgrounds
- ❌ `ring-indigo-500/50` — 50% translucent ring disappears on dark bg
- ❌ `ring-white/20` — 20% white ring is essentially invisible
- ❌ `dark:ring-indigo-900` — darkest shade of indigo = invisible on dark bg
- ❌ `shadow-indigo-500/25 dark:shadow-violet-600/30` — shadows invisible on dark bg

**Root cause**: Translucency on dark backgrounds = invisible. At mobile sizes (32-56px), subtle rings/shadows are imperceptible.

## Correct Pattern (ALWAYS DO)

When fixing contrast for the SECOND time (user says "still invisible"), be **3x more aggressive**:

1. **Use SOLID colors** — no gradients for small elements (32px). `bg-indigo-600` beats `bg-gradient-to-br from-indigo-500 to-violet-500`.
2. **Use 40%+ opacity** for rings/shadows. `ring-2 ring-white/40` beats `ring-1 ring-white/20`.
3. **Use BRIGHT shades** in dark mode. `dark:ring-indigo-300` beats `dark:ring-indigo-500/50`.
4. **Colored shadows need 40%+ opacity**: `shadow-indigo-400/40` beats `shadow-indigo-500/25`.

## Real Example: BizCard profile avatar + FAB

Iteration 1: `ring-indigo-100 dark:ring-indigo-900` → invisible (too dark)
Iteration 2: `ring-indigo-300 dark:ring-indigo-500/50` → still invisible (50% opacity)
**Winner**: `ring-indigo-400 dark:ring-indigo-300` + solid `bg-indigo-600`

Iteration 1: `bg-gradient from-indigo-500 to-violet-600` → okay but subtle on dark bg
Iteration 2: `shadow-indigo-500/25 ring-white/20` → shadows invisible on dark, 20% ring invisible
**Winner**: `bg-gradient from-indigo-400 to-violet-500` + `ring-2 ring-white/40` + `shadow-indigo-400/40`

## Process

1. **When user says "still not visible" after a fix** — STOP. Don't iterate again with the same approach.
2. **Review what was tried before** — was it translucent? opacity-based? dark-on-dark?
3. **Go 3x bolder** — brighter shade, higher opacity, solid color instead of gradient
4. **Deploy and verify** — ask user to test immediately
