---
name: deployed-project-investigation
description: "Investigate a deployed web project when you have no local source code — discover what it is, where source lives, tech stack, and structure using Vercel API, GitHub API, browser tools, and session history."
version: 1.0.0
metadata:
  hermes:
    tags: [investigation, vercel, browser, deployment, discovery]
    related_skills: [vercel-deployment-debugging, dogfood, codebase-inspection]
---

# Deployed Project Investigation

## When to Use

- Simon asks about a project you don't have in your workspace
- A live URL is given but no local source code or GitHub repo
- You need to discover: what is this, what tech stack, where's the source, who built it
- Before offering to modify a project, first find the source

## Workflow

Run these steps in parallel where possible. Stop when source is found.

### Step 1: Local Workspace Search

```bash
search_files(pattern="*project-name*", path="/Users/simonchow/.hermes/workspace", target="files")
search_files(pattern="*project-keyword*", path="/Users/simonchow", target="files")
```

### Step 2: Session History

```python
session_search(query="project-name OR key terms", limit=3)
```

### Step 3: Vercel API (if URL is `*.vercel.app`)

Extract project name from URL (e.g., `ai-photo-portfolio-gmsy1jjua-...vercel.app` → `ai-photo-portfolio`).

```bash
# Get project info — reveals creator, linked repo, framework, node version
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/PROJECT_NAME?teamId=$TEAM_ID"

# Check linked GitHub repo
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/PROJECT_NAME?teamId=$TEAM_ID" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('link:', json.dumps(d.get('link')))"

# Get latest deployments — reveals creator email, readyState, build framework
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/PROJECT_NAME?teamId=$TEAM_ID" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('latestDeployments',[])[:2], indent=2))"
```

### Step 4: GitHub API

```bash
# Search user repos for matching name
curl -s "https://api.github.com/users/USERNAME/repos?per_page=50" | \
  python3 -c "import json,sys; [print(r['name']) for r in json.load(sys.stdin)]"
```

### Step 5: Browser Investigation (Live Site)

Navigate to the live URL and extract structure:

```javascript
// Framework detection
document.querySelector('[data-react-root]') ? 'React' : 
  document.querySelector('script[src*="vue"]') ? 'Vue' : 
  document.querySelector('script[src*="next"]') ? 'Next.js' : 
  'Static/Unknown'

// All links on page
JSON.stringify(Array.from(document.querySelectorAll('a')).map(a => ({
  text: a.textContent.trim().substring(0, 30), 
  href: a.getAttribute('href') || 'none'
})))

// Full page source (for static HTML sites)
document.documentElement.outerHTML.substring(0, 5000)

// Navigation structure
document.querySelector('nav')?.outerHTML.substring(0, 2000) || 'NO NAV'

// Script sources
Array.from(document.querySelectorAll('script[src]')).map(s => s.src).join(', ')
```

### Step 6: Report Findings

Summarize in a table:

| Aspect | Finding |
|---|---|
| Framework | Static HTML / React / Next.js / Vue |
| Repo | GitHub link or none |
| Deployer | Email/username from Vercel |
| Has Navbar | Yes/No |
| Has Routing | SPA routing / anchor links / none |
| Source Available | Local / GitHub / neither |

## Key Vercel Credentials

- Token: stored in memory/environment
- Team ID: `team_7tOYiJpboYxS98aZpR7a7hhk` (simonator1001's team)

## Pitfalls

- Vercel projects without GitHub link (`link: null`) were deployed directly (CLI upload / drag-drop) — no repo to clone
- Static HTML sites have no framework, no routing, no navbar — they're single-page landing pages
- `browser_vision` fails with DeepSeek v4 Pro (no `image_url` support) — use `browser_console` JS queries instead
- The `browser_snapshot(full=true)` may return empty for SPA pages that haven't hydrated yet — use `browser_console` as fallback
