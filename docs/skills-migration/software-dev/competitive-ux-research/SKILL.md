---
name: competitive-ux-research
description: "Research competitor UX patterns and write app redesign proposals — analyze competitors via App Store/YouTube/web, synthesize findings, deliver structured report with implementation plan."
version: 1.0.0
metadata:
  hermes:
    tags: [ux, research, design, competitor-analysis, redesign, proposal]
    related_skills: [dogfood, deployed-project-investigation]
---

# Competitive UX Research & Redesign Proposal

## When to Use

- User wants to redesign an app's layout/navigation/UX
- User references a competitor as inspiration ("make it more like CamCard")
- User asks for "extensive research" or "UI reframe proposal"
- Before implementing any major layout change — research first

## Workflow

### Step 1: Understand Current State

Read the relevant source files to understand current layout:
```
read_file(path="components/HomePage.tsx")  # or main layout component
```

Note: default tab, tab order, tab count, component structure, any FAB or add button location.

### Step 2: Research Competitors (Efficiently — NO Parallel Subagents)

**🚨 CRITICAL: Load this skill BEFORE spawning any subagents.** In one session, 3 parallel subagents were spawned and ALL timed out at 600s each = 30 minutes wasted.

**Recommended approach (in order):**

**A) Single focused subagent** with `web+terminal` toolsets (NO browser). Give it ALL competitors in ONE goal:
```
delegate_task(
  goal="Research CamCard, Blinq, HiHello, Covve UX layout...",
  toolsets=["web", "terminal"],
  context="..."
)
```
One subagent, 5-10 minutes. Much faster than 3 parallel ones that all hit Cloudflare walls.

**B) Direct browser for App Store pages** (these work in headless browser). Do this YOURSELF, not via subagent:
```
browser_navigate(url="https://apps.apple.com/us/app/camcard-...")
browser_console(expression="...")  // extract screenshot URLs, description text
browser_get_images()               // get screenshot image URLs
```

**C) For YouTube:** Search via the subagent (step A). Extract video descriptions for screen/tab names. Cloudflare blocks direct browser access to YouTube.

### Step 3: Gather Specific Data Points

For each competitor, collect:
- **Default landing screen** (what user sees first)
- **Bottom navigation tabs** (exact labels and order)
- **Add/scan button location** (tab, FAB, top-right, bottom-center?)
- **FAB presence and behavior**
- **Notable UX patterns** (swipe actions, card thumbnails, search bar placement)
- **Polish details** (animations, haptics, visual flourishes)
- **App Store rating and download count** (proxy for success)

### Step 4: Analyze the Paradigm

Identify the core UX decision you're evaluating (e.g., "Scan-First vs Contacts-First").

Create a comparison table:
| App | Type | Default Screen | Tabs | Rating |
|-----|------|---------------|------|--------|

Look for patterns: what do ALL successful apps do? What do only the failures do?

### Step 5: Write the Proposal

Structure the report with these sections:
1. **Executive Summary** — one paragraph, the verdict
2. **Competitive Landscape** — per-app breakdown with screenshots/tables
3. **UX Paradigm Analysis** — tradeoffs analysis, pros/cons, verdict
4. **Reference Designs** — what works from outside the category (Apple Contacts, Linear)
5. **Proposed Redesign** — new IA diagram, tab structure, FAB design, visual polish
6. **Implementation Plan** — phased: Quick Win → Polish → Advanced
7. **Appendix** — current code structure for reference

Save to `docs/ui-reframe-proposal.md` in the project directory.

### Step 6: Deliver Summary

Present a concise summary (not the full doc) with:
- The one key finding
- Before/after tab comparison
- Quick win that can be done immediately
- Link to full proposal doc

## Key Tools & Pitfalls

| Tool | Use for | Pitfall |
|------|---------|---------|
| `delegate_task(web+terminal)` | Competitor research | Don't use browser toolsets — Cloudflare blocks. **Use ONE subagent**, not 3 parallel — all 3 will timeout at 600s each (30 min wasted) |
| `browser_navigate` | App Store pages | Works for Apple, not YouTube/Medium |
| `browser_vision` | Screenshot analysis | FAILS with DeepSeek v4 Pro (no image_url support). Use workarounds below instead |
| YouTube research | Video descriptions | Extract text descriptions only — can't view videos |

### Vision Workarounds (When Your Model Can't See Images)

When the user sends a screenshot and `browser_vision` fails, use these fallbacks in order:

1. **OCR the screenshot** — Use the app's own scan/OCR API to extract text content from the image. This reveals WHAT content is on screen (card names, companies, buttons) even if you can't see the layout:
   ```python
   # Send to app's /api/scan endpoint
   body = {"image": f"data:image/jpeg;base64,{b64}", "userId": "debug"}
   ```
   This tells you WHAT the user is looking at (e.g., "Cherry Cheng, PARKnSHOP") — useful for context.

2. **Pixel sampling** — Use PIL to sample RGB colors at known Y positions to detect:
   - Dark mode vs light mode (dominant background color)
   - Header area (y=0-60), content cards (y=200-1000), tab bar (y=1180-1250)
   - Presence of brand colors (indigo/violet)
   - Card/light areas vs background

3. **ASCII art dump** — Downsample to ~80x50 and convert brightness to characters:
   ```python
   img.resize((80, 50))
   chars = " .:-=+*#%@"
   # Map brightness to character index
   ```
   Broad patterns emerge: header bars, card blocks, tab bar, scroll indicators.

4. **ASK THE USER** — After 2-3 failed approaches, stop and ask the user to describe the bug. Don't burn 10+ tool calls trying to see an image your model literally cannot process. A simple "我可以形容下你見到咩 bug 嗎？" saves everyone time.

## Step 7: Implement from the Proposal

When the user approves the proposal and says "start implementing", follow these phases:

### Phase A: Tab/Nav Reorder (Quick Win)
- Change default active tab state
- Reorder items in the tab bar/nav array
- Update URL param sync logic (default fallback)
- Example: `useState<Tab>('contacts')` + reorder `[{id:'contacts'},{id:'scan'},{id:'mycard'}]`

### Phase B: FAB (Floating Action Button)
- Add a fixed-position button above the tab bar (`bottom-20 right-5 z-40`)
- Only visible on the contacts/list tab: `{activeTab === 'contacts' && <FAB />}`
- Single tap → navigate to scan/add tab
- Long press / tap-to-expand → menu: Scan Card / Import Photo / Add Manually
- Pulse animation on first render for discoverability
- Use `onBlur` with `setTimeout(200)` to close menu

### Phase C: Card Thumbnails
- Replace generic icon placeholders with styled card-like thumbnails
- Use aspect-ratio containers (`aspect-[3/2]` for business cards, `w-24 h-16` for list)
- Fallback: show initials with brand gradient background
- **Check image URL handling** — migrated apps (Supabase→AppWrite) often have broken `getImageUrl()` stubs that return `null`. Fix by passing through HTTPS URLs directly.

### Phase D: Swipe Actions
- Add touch handlers: `onTouchStart`, `onTouchMove`, `onTouchEnd`
- Track `swipeOffset` state (-200 to 0), translate the card with CSS transform
- Behind the sliding card, render action buttons (Mail, Phone, LinkedIn, Share)
- Snap: lock open at -160px if swiped past 80px, otherwise snap back to 0

### Phase E: Empty State
- When contacts list is empty, show a welcoming illustration instead of "no results"
- Card-shaped placeholder with dashed border + camera icon
- Context-aware: "Your Digital Rolodex" (no cards) vs "No matching contacts" (search active)
- Gradient CTA button: "Scan First Card" → navigates to scan tab

### Build → Deploy → Verify Loop
After EACH phase or batch of changes:
1. `npx next build` — catch syntax/type errors early
2. Fix any build errors iteratively (check `npx tsc --noEmit` for specific line numbers)
3. `npx vercel deploy --prod --yes` — deploy to production
4. `browser_navigate(url)` + `browser_console()` — verify zero JS errors, correct tab order, FAB visibility
5. Fix page title in `app/layout.tsx` metadata if it's stale from a previous brand name

### Common Pitfalls
- **JSX nesting errors from patch tool**: When wrapping existing JSX with new containers, the patch tool can create structural issues. If build fails with "JSX fragment has no corresponding closing tag", revert (`git checkout --`) and rewrite the entire file with `write_file` instead of patching.
- **Missing closing `</div>` after `{condition && (...)}` blocks**: The ternary `? ... : ...` structure needs proper closing tags. Always verify the full JSX tree.
- **AppWrite image URLs**: After Supabase→AppWrite migration, `getImageUrl()` often returns `null`. Fix by detecting `https://` prefix and passing through directly.
- **Shadcn `ring-2 ring-primary` on selected cards**: The ring creates a full purple outline that looks like a long strip on mobile list views. Replace with `border-l-4 border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20` for a cleaner left-accent-bar selection indicator. Apply across all view modes (list/grid/carousel).

## Output Format

Final proposal saved as Markdown with:
- Comparison tables (competitor vs competitor)
- ASCII wireframes (text-based layout diagrams)
- Priority-labeled feature tables
- Phased implementation plan with time estimates
