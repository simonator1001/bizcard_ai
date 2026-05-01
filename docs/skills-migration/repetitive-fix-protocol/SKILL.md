---
name: repetitive-fix-protocol
description: When the same bug/issue is reported 2+ times across sessions without being fixed — STOP, review past attempts, find root cause, propose roadmap. NEVER iterate blindly.
---

# Repetitive Fix Protocol

## Trigger

When user says ANY of:
- "之前已經找了好幾次" (tried several times before)
- "為什麼不成功" (why didn't it work)
- "不要再重複之前的失敗" (don't repeat past failures)
- "同一個問題重複發生了幾次" (same problem happened multiple times)
- Same bug reported across 2+ sessions without resolution

## Protocol (MANDATORY — do not skip steps)

### Phase 0: STOP AND RECOGNIZE
Do NOT immediately try another fix. Say: "Let me review past attempts first."

### Phase 1: RECALL PAST ATTEMPTS
```
session_search → what was tried? what was the result?
memory → any notes about this bug?
git log → what commits touched the relevant files?
```

Catalog EVERY attempt in a table:
| # | What was tried | Why it failed | When |
|---|---|---|---|
| 1 | Changed X to Y | Global CSS override | Session A |
| 2 | Added Z property | Still overridden by parent | Session B |

### Phase 2: ROOT CAUSE ANALYSIS
Don't fix symptoms. Find the ACTUAL root cause:
- Is a global CSS rule overriding the element? (button min-height, input styles, etc.)
- Is the fix on the wrong element entirely?
- Is a parent component intercepting props/styles?
- Is there a CSS specificity conflict?
- Is the build/deploy not including the fix?

### Phase 3: PROPOSE ROADMAP (before writing code)
Present a clear plan to the user:
```
Root cause: [explain]
Failed approach 1: [why]
Failed approach 2: [why]
Correct fix: [what + why it will work]
Verification: [how to confirm]
```

### Phase 4: ONE FIX AT A TIME
Deploy. Ask user to verify. Don't batch multiple fixes for the SAME recurring bug.

## Anti-Patterns (NEVER DO)

- ❌ Make the same type of change expecting different results
- ❌ Fix symptoms without understanding root cause
- ❌ Use translucent/opacity colors when contrast is the complaint
- ❌ Trust that `rounded-full` works without checking for CSS overrides
- ❌ Assume the fix is on the right element without verifying

## Real Example: BizCard selection buttons

**Symptom**: Selection radio buttons look square
**Attempt 1**: Replaced Radix Checkbox → custom round `<button>` with `rounded-full w-5 h-5`
**Why failed**: CSS didn't catch the real issue
**Attempt 2-4**: Changed `rounded-full`, `w-5`, `h-5` values  
**Why all failed**: None addressed root cause
**Root cause**: Global CSS `button{min-height:44px}` overriding `h-5` → 20×44 rectangle
**Correct fix**: `min-h-0` to override global rule
**Lesson**: Inspect COMPUTED styles, not just source code

## Default Actions

After creating the roadmap and fixing, ALWAYS:
1. Save root cause pattern to `memory`
2. Update relevant skill if one exists
3. Load this protocol FIRST on any future recurring bug
