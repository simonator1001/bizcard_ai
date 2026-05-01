---
name: systematic-debugging
description: "4-phase root cause debugging: understand bugs before fixing."
version: 1.1.0
author: Hermes Agent (adapted from obra/superpowers)
license: MIT
metadata:
  hermes:
    tags: [debugging, troubleshooting, problem-solving, root-cause, investigation]
    related_skills: [test-driven-development, writing-plans, subagent-driven-development]
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**Violating the letter of this process is violating the spirit of debugging.**

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use

Use for ANY technical issue:
- Test failures
- Bugs in production
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work
- You don't fully understand the issue

**Don't skip when:**
- Issue seems simple (simple bugs have root causes too)
- You're in a hurry (rushing guarantees rework)
- Someone wants it fixed NOW (systematic is faster than thrashing)

## The Four Phases

You MUST complete each phase before proceeding to the next.

---

## Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

### 1. Read Error Messages Carefully

- Don't skip past errors or warnings
- They often contain the exact solution
- Read stack traces completely
- Note line numbers, file paths, error codes

**Action:** Use `read_file` on the relevant source files. Use `search_files` to find the error string in the codebase.

### 2. Reproduce Consistently

- Can you trigger it reliably?
- What are the exact steps?
- Does it happen every time?
- If not reproducible → gather more data, don't guess

**Action:** Use the `terminal` tool to run the failing test or trigger the bug:

```bash
# Run specific failing test
pytest tests/test_module.py::test_name -v

# Run with verbose output
pytest tests/test_module.py -v --tb=long
```

### 3. Check Recent Changes

- What changed that could cause this?
- Git diff, recent commits
- New dependencies, config changes

**Action:**

```bash
# Recent commits
git log --oneline -10

# Uncommitted changes
git diff

# Changes in specific file
git log -p --follow src/problematic_file.py | head -100
```

### 4. Gather Evidence in Multi-Component Systems

**WHEN system has multiple components (API → service → database, CI → build → deploy):**

**BEFORE proposing fixes, add diagnostic instrumentation:**

For EACH component boundary:
- Log what data enters the component
- Log what data exits the component
- Verify environment/config propagation
- Check state at each layer

Run once to gather evidence showing WHERE it breaks.
THEN analyze evidence to identify the failing component.
THEN investigate that specific component.

#### 4a. Debug UI Bugs from Screenshots Without Vision

**WHEN the user reports a UI bug with a screenshot but your model can't do vision analysis**, use these techniques to triangulate what's on screen before touching any code:

1. **Pixel Analysis (PIL)**: Sample key regions (header, content, tab bar) for colors and patterns:
```python
from PIL import Image
img = Image.open("screenshot.jpg")
# Check dominant colors, find indigo/purple, detect layout edges
```

2. **OCR via App's API**: If the app has an image→text endpoint, use it to extract visible text:
```python
# Use bizcard scan API, or any app endpoint that processes images
```

3. **Browser DOM Inspection**: Load the deployed app and use `browser_console(expression=...)` to query the DOM:
```javascript
// Check for specific elements
document.querySelectorAll('[role="checkbox"]').length
// Get computed styles
getComputedStyle(document.querySelector('.card')).border
```

4. **ASCII Art Rendering**: Downsample the image for a rough visual:
```python
img_small = img.resize((80, 50))
# Map brightness to ASCII characters
```

**⚠️ CRITICAL**: Before modifying ANY element, confirm you've identified the EXACT one the user is referring to. Ask clarifying questions if unsure. Wrong-element fixes waste the user's time and erode trust.

#### 4b. Detect Stale Deployments (Browser Console vs. Source Code Diff)

**WHEN a deployed web app behaves differently from what the repo code should produce**, the deployment may be stale — the CI/CD pipeline didn't pick up recent commits.

**Technique**:
1. **Open the deployed app** with `browser_navigate` and trigger the failing feature
2. **Capture the console** with `browser_console()` — note specific log messages, debug strings, API URLs
3. **Search the repo source code** for those exact log strings with `search_files`
4. **Compare**: If the deployed console shows log strings that DON'T exist in the current repo code (e.g., Supabase `GoTrueClient` logs when the repo has a mock), the deployment is stale
5. **Check for env var overrides**: If the deployed OAuth URL shows a different endpoint/project than the code default, Vercel/Netlify env vars are overriding. Check the hosting dashboard — env vars take priority over code defaults even after new code is pushed

**Red flags that indicate a stale deployment**:
- Console shows debug logs from libraries/code that were removed from the repo
- API calls go to old endpoints despite code updates
- Newly created routes return 404 on the deployed URL
- The deployed app references packages/configs that no longer exist in `package.json`

**Action**: If stale, trigger a manual redeploy from the hosting dashboard. If that fails, check CI/CD webhook connectivity.

#### 4c. Debug CSS Rendering Bugs (Component Looks Right, Browser Renders Wrong)

**WHEN Tailwind classes in the component source look correct but the browser renders something different** (e.g., `rounded-full w-5 h-5` renders as a rectangle), the root cause is almost certainly a **global CSS rule** with conflicting side effects — NOT the component's own classes.

**Pattern**: The component `className` is correct, but a global rule (often in `styles/globals.css` or a CSS reset) adds properties like `min-height`, `min-width`, `box-sizing`, or `display` that interact unexpectedly with Tailwind utilities.

**Most common culprit — mobile touch-target rules**:
```css
/* In globals.css — forces ALL buttons to minimum touch size */
button, input[type=button], input[type=submit] { min-height: 44px }
```

Effects:
- `rounded-full w-5 h-5` button → 20px wide × 44px tall = elongated pill shape (looks like a rectangle)
- `rounded-full w-9 h-9` → 36px wide × 44px tall (less noticeable, but not a perfect circle)
- Any small button gets stretched vertically by the global rule

**Step-by-step investigation**:

1. **Read the deployed CSS bundle** — fetch it with curl and grep for the property that would cause the distortion:
```bash
curl -sS 'https://yourapp.com' | grep -o '/_next/static/css/[^"]*\.css' | head -3
curl -sS 'https://yourapp.com/_next/static/css/abcdef.css' | grep 'min-height\|min-width\|max-height'
```

2. **Search source globals** — check `styles/globals.css`, `app/globals.css`, and any CSS reset files for broad element selectors (`button`, `input`, `a`) with dimension properties.

3. **Fix with specificity override**: Add a Tailwind class that resets the problematic property:
   - `min-h-0` overrides `min-height: 44px` on buttons
   - `min-w-0` overrides `min-width` on inputs
   - Use class selectors (specificity 0,1,0), which beat type selectors (specificity 0,0,1)

4. **Verify ALL view modes**: List, grid, carousel — each may have separate JSX with the same button pattern. Fix each occurrence.

**Related pattern — text overflow in flex layouts**:

When text spills past card boundaries even with `truncate` on `<p>` elements, check the parent containers:
```jsx
// BROKEN: parent div has no overflow constraint
<div>                          // ← no overflow-hidden or min-w-0
  <p className="truncate">...</p>  // truncate useless if parent grows
</div>

// FIXED: parent constrains content
<div className="min-w-0 overflow-hidden">
  <p className="truncate">...</p>
</div>
```
Also ensure action icon containers have `flex-shrink-0` so they don't get squeezed by overflowing text:
```jsx
<div className="flex items-center gap-2 flex-shrink-0">
```

**Related pattern — invisible text in shadcn AvatarFallback**:

When `AvatarFallback` shows initials/letters that appear as faint white blobs (text invisible), the root cause is that shadcn's default `AvatarFallback` has `bg-muted` background but **no text color class**. The text inherits from its parent, which on light card backgrounds may default to a light/white color that blends into `bg-muted` (light gray).

```jsx
// BROKEN: text inherits parent color, blends into bg-muted
<AvatarFallback>{initials}</AvatarFallback>

// FIXED: explicit foreground text ensures contrast
<AvatarFallback className="text-foreground font-medium">{initials}</AvatarFallback>
```

**Red flags**: User reports "just white things" in avatar circles; the `AvatarFallback` JSX has no className prop; shadcn's default styling docs show no default text color on fallback.

**Related pattern — invisible ghost buttons**:

When buttons use `variant="ghost"` (transparent by default) on a matching card background, they become invisible. Fix by adding a subtle but visible background:
```jsx
// BROKEN: invisible on white card
<Button variant="ghost"><MoreVertical /></Button>

// FIXED: subtle backdrop keeps it visible
<Button variant="ghost" className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm">
  <MoreVertical />
</Button>
```

#### 4d. Debug Dark Mode Contrast Issues

**WHEN elements that should be visible in dark mode are invisible or hard to see**, the issue is almost always that the `dark:` Tailwind variants use colors too similar to the dark container background.

**Most common patterns and their fixes**:

**Pattern A — Toolbar buttons blending into toolbar background**:
When toolbar buttons use `dark:bg-gray-800` on a `dark:bg-zinc-900` toolbar container, the buttons are nearly invisible. Fix: increase the contrast between button and container by using `dark:bg-gray-700` + a visible border.
```jsx
// BROKEN: button blends into zinc-900 toolbar
<button className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg">

// FIXED: darker button bg + border for separation
<button className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-zinc-200 rounded-lg border border-gray-200 dark:border-gray-600">
```

**Pattern B — Inactive toggle buttons too dim**:
View mode toggles in inactive state often use `text-gray-400` which is nearly invisible on dark backgrounds. Fix: use `dark:text-gray-500` with `dark:hover:text-gray-300`.
```jsx
// BROKEN: barely visible
inactive: "text-gray-400 hover:text-gray-600"

// FIXED: visible but still clearly "inactive"
inactive: "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
```

**Pattern C — Profile/avatar rings invisible**:
When avatar rings use `dark:ring-indigo-900` (the darkest indigo shade), they disappear against dark backgrounds. Fix: use a mid-tone with opacity, like `dark:ring-indigo-500/50`.
```jsx
// BROKEN: ring-indigo-900 = #312e81, invisible on dark bg
<Avatar className="ring-2 ring-indigo-100 dark:ring-indigo-900">

// FIXED: mid-tone indigo at 50% opacity creates a visible glow
<Avatar className="ring-2 ring-indigo-300 dark:ring-indigo-500/50">
```

**Pattern D — FAB button not "popping" on dark backgrounds**:
Gradient FABs (`from-indigo-500 to-violet-600`) on `dark:bg-gray-950` pages can look muted. Fix: add a colored shadow (`shadow-indigo-500/25`) and a subtle white ring (`ring-1 ring-white/20`).
```jsx
// BROKEN: generic shadow, no ring — blends on dark page
<button className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">

// FIXED: colored shadow + subtle ring makes it pop
<button className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 dark:shadow-violet-600/30 ring-1 ring-white/20">
```

**Pattern E — Card text overflow with 3-line truncate**:
When cards show very little text due to a large thumbnail + 3-line truncation, the layout wastes space. Fix: reduce thumbnail width, merge secondary info into 1 line, compact icons.
```jsx
// BROKEN: large thumbnail (96px), 3 truncated lines = only 3-5 chars visible
<div className="flex gap-4">
  <div className="w-24 h-16 ...">{thumbnail}</div>    {/* 96px */}
  <div>
    <p className="truncate">Name...</p>                {/* 1 line */}
    <p className="text-sm truncate">Title...</p>       {/* 1 line */}
    <p className="text-sm truncate">Company...</p>     {/* 1 line */}
  </div>
</div>

// FIXED: smaller thumbnail (64px), company·title on 1 line, compact icons
<div className="flex gap-3">
  <div className="w-16 h-12 ...">{thumbnail}</div>    {/* 64px — saves 32px */}
  <div>
    <p className="text-sm font-semibold truncate">Name</p>         {/* bold */}
    <p className="text-xs text-muted-foreground truncate">         {/* space-efficient */}
      {[card.company, card.title].filter(Boolean).join(' · ')}
    </p>
  </div>
</div>
```

**Investigation approach for dark mode contrast issues**:
1. Identify the element the user reports as "invisible" — get exact position (top-right, bottom-right, etc.)
2. Read the element's `dark:` variant classes
3. Compare against the parent container's `dark:` background class
4. If they're within ~2 shade levels of each other in the Tailwind scale, contrast is too low
5. Increase the gap by at least 3 shade levels, OR add a visible border/ring to create separation

**Red flags that signal this class of bug**:
- Component code has correct Tailwind classes but rendered output is wrong
- Multiple previous fix attempts targeting the component classes all failed
- The distortion is always in the same dimension (e.g., always too tall, never too wide)
- The element in question is a `<button>` or `<input>` type

### 5. Trace Data Flow

**WHEN error is deep in the call stack:**

- Where does the bad value originate?
- What called this function with the bad value?
- Keep tracing upstream until you find the source
- Fix at the source, not at the symptom

**Action:** Use `search_files` to trace references:

```python
# Find where the function is called
search_files("function_name(", path="src/", file_glob="*.py")

# Find where the variable is set
search_files("variable_name\\s*=", path="src/", file_glob="*.py")
```

### Phase 1 Completion Checklist

- [ ] Error messages fully read and understood
- [ ] Issue reproduced consistently
- [ ] Recent changes identified and reviewed
- [ ] Evidence gathered (logs, state, data flow)
- [ ] Problem isolated to specific component/code
- [ ] Root cause hypothesis formed

**STOP:** Do not proceed to Phase 2 until you understand WHY it's happening.

---

## Phase 2: Pattern Analysis

**Find the pattern before fixing:**

### 1. Find Working Examples

- Locate similar working code in the same codebase
- What works that's similar to what's broken?

**Action:** Use `search_files` to find comparable patterns:

```python
search_files("similar_pattern", path="src/", file_glob="*.py")
```

### 2. Compare Against References

- If implementing a pattern, read the reference implementation COMPLETELY
- Don't skim — read every line
- Understand the pattern fully before applying

### 3. Identify Differences

- What's different between working and broken?
- List every difference, however small
- Don't assume "that can't matter"

### 4. Understand Dependencies

- What other components does this need?
- What settings, config, environment?
- What assumptions does it make?

---

## Phase 3: Hypothesis and Testing

**Scientific method:**

### 1. Form a Single Hypothesis

- State clearly: "I think X is the root cause because Y"
- Write it down
- Be specific, not vague

### 2. Test Minimally

- Make the SMALLEST possible change to test the hypothesis
- One variable at a time
- Don't fix multiple things at once

### 3. Verify Before Continuing

- Did it work? → Phase 4
- Didn't work? → Form NEW hypothesis
- DON'T add more fixes on top

### 4. When You Don't Know

- Say "I don't understand X"
- Don't pretend to know
- Ask the user for help
- Research more

---

## Phase 4: Implementation

**Fix the root cause, not the symptom:**

### 1. Create Failing Test Case

- Simplest possible reproduction
- Automated test if possible
- MUST have before fixing
- Use the `test-driven-development` skill

### 2. Implement Single Fix

- Address the root cause identified
- ONE change at a time
- No "while I'm here" improvements
- No bundled refactoring

### 3. Verify Fix

```bash
# Run the specific regression test
pytest tests/test_module.py::test_regression -v

# Run full suite — no regressions
pytest tests/ -q
```

### 4. If Fix Doesn't Work — The Rule of Three

- **STOP.**
- Count: How many fixes have you tried?
- If < 3: Return to Phase 1, re-analyze with new information
- **If ≥ 3: STOP and question the architecture (step 5 below)**
- DON'T attempt Fix #4 without architectural discussion

### 5. If 3+ Fixes Failed: Question Architecture

**Pattern indicating an architectural problem:**
- Each fix reveals new shared state/coupling in a different place
- Fixes require "massive refactoring" to implement
- Each fix creates new symptoms elsewhere

**STOP and question fundamentals:**
- Is this pattern fundamentally sound?
- Are we "sticking with it through sheer inertia"?
- Should we refactor the architecture vs. continue fixing symptoms?

**Discuss with the user before attempting more fixes.**

This is NOT a failed hypothesis — this is a wrong architecture.

---

## Red Flags — STOP and Follow Process

If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Pattern says X but I'll adapt it differently"
- "Here are the main problems: [lists fixes without investigation]"
- Proposing solutions before tracing data flow
- **"One more fix attempt" (when already tried 2+)**
- **Each fix reveals a new problem in a different place**

**ALL of these mean: STOP. Return to Phase 1.**

**If 3+ fixes failed:** Question the architecture (Phase 4 step 5).

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need process" | Simple issues have root causes too. Process is fast for simple bugs. |
| "Emergency, no time for process" | Systematic debugging is FASTER than guess-and-check thrashing. |
| "Just try this first, then investigate" | First fix sets the pattern. Do it right from the start. |
| "I'll write test after confirming fix works" | Untested fixes don't stick. Test first proves it. |
| "Multiple fixes at once saves time" | Can't isolate what worked. Causes new bugs. |
| "Reference too long, I'll adapt the pattern" | Partial understanding guarantees bugs. Read it completely. |
**"I see the problem, let me fix it"** | Seeing symptoms ≠ understanding root cause. |
**"Conversation summary said it was already fixed"** | Compressed context can be wrong. Always read the actual files before trusting a prior-session claim about code state — especially when the previous session used `vercel --prod` CLI (which deploys without syncing to local git). |
| "One more fix attempt" (after 2+ failures) | 3+ failures = architectural problem. Question the pattern, don't fix again. |

## Quick Reference

| Phase | Key Activities | Success Criteria |
|-------|---------------|------------------|
| **1. Root Cause** | Read errors, reproduce, check changes, gather evidence, trace data flow | Understand WHAT and WHY |
| **2. Pattern** | Find working examples, compare, identify differences | Know what's different |
| **3. Hypothesis** | Form theory, test minimally, one variable at a time | Confirmed or new hypothesis |
| **4. Implementation** | Create regression test, fix root cause, verify | Bug resolved, all tests pass |

## Hermes Agent Integration

### Investigation Tools

Use these Hermes tools during Phase 1:

- **`search_files`** — Find error strings, trace function calls, locate patterns
- **`read_file`** — Read source code with line numbers for precise analysis
- **`terminal`** — Run tests, check git history, reproduce bugs
- **`web_search`/`web_extract`** — Research error messages, library docs

### With delegate_task

For complex multi-component debugging, dispatch investigation subagents:

```python
delegate_task(
    goal="Investigate why [specific test/behavior] fails",
    context="""
    Follow systematic-debugging skill:
    1. Read the error message carefully
    2. Reproduce the issue
    3. Trace the data flow to find root cause
    4. Report findings — do NOT fix yet

    Error: [paste full error]
    File: [path to failing code]
    Test command: [exact command]
    """,
    toolsets=['terminal', 'file']
)
```

### With test-driven-development

When fixing bugs:
1. Write a test that reproduces the bug (RED)
2. Debug systematically to find root cause
3. Fix the root cause (GREEN)
4. The test proves the fix and prevents regression

## Real-World Impact

From debugging sessions:
- Systematic approach: 15-30 minutes to fix
- Random fixes approach: 2-3 hours of thrashing
- First-time fix rate: 95% vs 40%
- New bugs introduced: Near zero vs common

**No shortcuts. No guessing. Systematic always wins.**
