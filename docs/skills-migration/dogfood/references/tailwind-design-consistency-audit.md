# Tailwind Design Consistency Audit

## When to Use

After a theme/color scheme migration in a Tailwind CSS project. User says things like:
- "scan the UI and look out for any other weird stuff"
- "colors look off"
- "this element looks wrong / off scale"
- "doesn't match the rest of the app"

Or proactively: whenever you change the primary color scheme of a Tailwind project.

## Workflow

### Phase 1: Grep for Old Color Remnants

```bash
cd <project>
grep -rn "fuchsia\\|pink-\\|purple-\\|rose-\\|<old-accent>" \
  components/ app/ pages/ --include="*.tsx" --include="*.ts" --include="*.css" \
  | grep -v node_modules | grep -v ".next"
```

Common old color patterns that get missed:
- View mode toggles (list/grid buttons)
- Active states on toolbar buttons
- Badges, icons, avatar fallbacks
- Card borders and backgrounds
- Gradient backgrounds

### Phase 1.5: Check CSS Variables (CRITICAL — most overlooked)

**This is the most commonly missed step in theme migrations.** Shadcn UI and other component libraries use CSS custom properties from `globals.css` to drive all component colors. If these are still set to old theme values, EVERY `bg-muted`, `bg-secondary`, `text-primary-foreground`, etc. will render in the wrong color — even after all Tailwind classes have been updated.

**Read `app/globals.css`** and check these variables in both `:root` (light) and `.dark` blocks:

| Variable | What it colors | Must match new theme |
|----------|---------------|---------------------|
| `--primary` | Primary buttons, links, focus rings | e.g., `243 75% 59%` (indigo) |
| `--secondary` | Secondary buttons, badges | e.g., `263 70% 60%` (violet) |
| `--muted` | Card backgrounds, input placeholders, disabled states | e.g., `240 5% 88%` (neutral gray) — NOT pink! |
| `--accent` | Accent backgrounds, hover states | e.g., `243 75% 95%` (light indigo) |
| `--ring` | Focus rings, outline | Should match `--primary` |
| `--border` | Input borders, card borders | Usually neutral, but check |
| `--destructive` | Error/danger states | Red is fine, but verify |

**Also check `body` background** in `globals.css` — if it has a gradient with old HSL values (e.g., `hsl(291, 64%, 98%)` for purple), the entire page background retains the old theme tint.

**Quick fix**: Update all HSL values to match the new color scheme, then commit + push (Vercel builds from git — uncommitted changes won't deploy).

### Phase 2: Fix Broken/Nonexistent CSS Classes

The most subtle visual bugs come from `absolute` positioned elements that lack a `relative` parent. The element positions itself relative to the nearest positioned ancestor (often the wrong container), causing it to float to unexpected locations.

**The pattern to grep for:**

```bash
grep -rn "absolute" components/ app/ --include="*.tsx" | grep -v "relative"
```

This won't be perfectly accurate (some `absolute` elements may have a `relative` ancestor further up), but flags candidates for manual review.

**Common offenders:**

| Pattern | What breaks | Fix |
|---------|-----------|-----|
| Tab bar / nav active indicators (`absolute -top-*` inside button) | Indicator floats to nav container top, stacks with siblings | Add `relative` to the button |
| Dropdown menu items (`absolute right-*` inside `<li>`) | Item floats to dropdown edge | Add `relative` to `<li>` |
| Badge overlays (`absolute -top-1 -right-1`) | Badge appears at page corner | Add `relative` to parent container |
| Tooltip arrows (`absolute -bottom-*`) | Arrow disconnects from tooltip | Add `relative` to tooltip wrapper |

**Quick browser verification:**

```js
// Check if absolute indicators sit on correct parent
Array.from(document.querySelectorAll('span.absolute')).map(el => ({
  text: el.textContent?.slice(0,20),
  parentRelative: window.getComputedStyle(el.parentElement).position === 'relative',
  parentTag: el.parentElement.tagName
}))
```

### Phase 3: Extended Broken Class Checklist

In addition to `safe-area-bottom` and `animate-in`/`fade-in`/`slide-in-from-bottom-*`, also check for:

```bash
grep -rn "safe-area\|animate-in\|fade-in\b\|slide-in\|bg-fuchsia\|bg-pink\|bg-rose\|text-fuchsia\|text-pink\b" \
  components/ app/ --include="*.tsx" --include="*.ts"
```

| Non-existent class | Replacement |
|-------------------|-------------|
| `safe-area-bottom` | `pb-[env(safe-area-inset-bottom,0px)]` |
| `safe-area-top` | `pt-[env(safe-area-inset-top,0px)]` |
| `animate-in` | Use defined keyframe from tailwind config (e.g., `animate-fade-in-up`) |
| `fade-in` (standalone) | Only works with `tailwindcss-animate` plugin; verify it's installed |
| `slide-in-from-bottom-*` | Only works with `tailwindcss-animate` plugin |

### Phase 4: Verify Animation Classes

1. Read `tailwind.config.js` — check `theme.extend.animation` for available animation names
2. If using `tailwindcss-animate` plugin, the plugin adds `animate-in`, `fade-in`, `slide-in-from-*` etc — verify the plugin is in `plugins: []` AND installed in `node_modules/`
3. If missing, either install the plugin or replace with available animations

### Phase 5: Check Secondary Components

These often get missed in a theme migration:
- `Toolbar.tsx` — filter/sort/export buttons, view toggles
- `SettingsTab.tsx` — settings page can have its own color scheme
- `pricing-card.tsx`, `pricing-cards.tsx` — pricing pages often have their own theme
- `AuthScreen.tsx` — login/signup screens
- `Navigation.tsx`, `AppLayout.tsx` — headers and sidebars
- Any dialog/modal components

### Phase 6: Browser Verification

After fixing:
1. Navigate to the deployed site: `https://<project>.vercel.app`
2. Check `browser_console()` for JS errors
3. Click through all tabs (even auth-gated ones — at minimum verify tab switching works)
4. Check that all visible UI elements use the new color scheme consistently
5. Run an API test if there's a backend flow (e.g., scan, save)

## Common Pitfalls

- **CSS variables in globals.css are NOT caught by grep** — `--muted: 340 82% 77%` looks like innocent numbers but is PINK. Shadcn components using `bg-muted` will render pink everywhere. Always read `globals.css` manually after a theme change.
- **Body background gradient** often uses old HSL values — the whole page tint remains wrong even if individual components are fixed.
- **DropdownMenuRadioGroup items** use the parent dropdown styling — they only look wrong if the dropdown itself is mis-colored
- **Shadcn UI components** inherit colors from CSS variables (e.g., `bg-primary`). These are theme-level and won't show in grep
- **Inline gradient classes** like `from-purple-600 to-pink-600` are easy to miss because they span two colors
- **Stale browser cache** after deploy — always test with `browser_navigate` fresh, not just API calls
- **Vercel builds from git, not local files** — if you patched files but didn't commit + push, the deployment has OLD code. Always `git status` before declaring a fix deployed.
