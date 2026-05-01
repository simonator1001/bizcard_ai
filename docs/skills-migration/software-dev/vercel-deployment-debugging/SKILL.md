---
name: vercel-deployment-debugging
description: Diagnose Vercel deployment failures via REST API — query deployment status, readyStateReason, team membership, and fix root causes without needing browser login.
---

# Vercel Deployment Debugging via API

## When to use
- A Vercel deployment shows ERROR/FAILED state and you need to find out why
- You see `TEAM_ACCESS_REQUIRED` or similar opaque error codes
- You need to check team membership, git author mismatch, or SSO protection settings
- You can't/don't want to log into the Vercel dashboard in a browser

## Prerequisites
- Vercel API token (stored in memory or env)
- Project ID (`prj_xxx`) and Team ID (`team_xxx`)

## API Endpoints (in order of usefulness)

### 1. Get deployment details with error reason (MOST IMPORTANT)
```bash
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v13/deployments/$DEPLOY_ID?teamId=$TEAM_ID"
```
The v13 endpoint returns **`readyStateReason`** — the exact human-readable error message. It also includes `errorLink` pointing to Vercel docs. This is the single most useful endpoint for debugging.

### 2. Get project settings & latest deployments
```bash
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v1/projects/$PROJECT_ID?teamId=$TEAM_ID"
```
Shows `ssoProtection`, `latestDeployments` (with readyState), `gitProviderOptions`, etc.

### 3. List team members
```bash
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v1/teams/$TEAM_ID/members"
```
Returns each member's email, role, uid, and GitHub login. Use this to cross-reference against the git commit author.

### 4. Get team details
```bash
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v2/teams/$TEAM_ID"
```
Shows plan (hobby/pro), billing status, resource config, etc.

### 5. Get deployment builds
```bash
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v2/deployments/$DEPLOY_ID/builds?teamId=$TEAM_ID"
```
Shows whether the build passed (`READY`) or failed — useful to distinguish build failures from deployment-gate failures.

### 6. Manage environment variables (CRUD)
```bash
# List env vars for a project
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v10/projects/$PROJECT_ID/env?teamId=$TEAM_ID"

# Create new env var (types: encrypted, plain, sensitive, system)
# ENV_CONFLICT if var already exists — use PATCH to update instead
curl -s -X POST -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.vercel.com/v10/projects/$PROJECT_ID/env?teamId=$TEAM_ID" \
  -d '{"key":"MY_VAR","value":"my-value","type":"encrypted","target":["production"]}'

# Update existing env var (need env var ID from list above)
curl -s -X PATCH -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.vercel.com/v10/projects/$PROJECT_ID/env/$ENV_ID?teamId=$TEAM_ID" \
  -d '{"value":"new-value"}'

# Delete env var
curl -s -X DELETE -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v10/projects/$PROJECT_ID/env/$ENV_ID?teamId=$TEAM_ID"
```

**Pitfall**: Updating env vars does NOT trigger a redeploy. After changing env vars, redeploy manually:
```bash
npx vercel --prod --yes --token "$VERCEL_TOKEN"
```

## Common failure patterns

### DEPLOY SUCCEEDS BUT NO CHANGES VISIBLE (local files not committed)
- **Symptom**: `npx vercel --prod` completes successfully ("Build Completed", "Aliased to production"), but the user reports the deployed app looks exactly the same — none of your fixes are live
- **Root cause**: If the project HAS Git integration, Vercel builds from the **git repository**, not your local working tree. If you patched files but never `git commit` + `git push`, the deployment contains old code.
- **Note**: If the project has NO Git integration (`source: "cli"`), `vercel --prod` uploads local files directly and does NOT require a git push — it works on `git commit` alone (no remote needed).
- **Diagnosis** — ALWAYS check git status before assuming a deploy picked up your changes:
  ```bash
  git status --short
  # If you see 'M file.tsx' or '?? newfile.tsx', your changes have NOT been deployed
  ```
- **Fix**:
  ```bash
  git add -A
  git commit -m "fix: description of changes"
  git push origin main   # Vercel auto-deploys on push (if Git-integrated)
  # OR trigger manual deploy (works with or without Git integration):
  npx vercel --prod --yes --token "$VERCEL_TOKEN"
  ```
- **Pitfall**: You can run `npx vercel --prod` dozens of times and Vercel will show "Build Completed" every time — but it's rebuilding the same old git commit, not your local edits. The CLI uploads build context from local files BUT the actual source that gets compiled is whatever's in the linked git repo. Always `git status` before deploying.
- **Pitfall — CLI deploy creates divergent commit**: When you run `npx vercel --prod` directly (CLI deploy), Vercel creates a deployment with `source: "cli"` and a commit SHA that only exists on Vercel — it was never pushed to GitHub. If the project has Git integration, the NEXT `git push` triggers a Vercel auto-deploy that deploys the GitHub commit, overwriting the CLI deploy. If the GitHub commit is OLDER and missing files (e.g., new API routes), those routes return 404. **Diagnosis**: compare `curl` deployment's `gitCommitSha` against `git log origin/main --oneline -5`. If the SHA doesn't appear in git log, you have a divergent deployment. **Fix**: `git push origin main` THEN verify the auto-deploy picked up the new commit, OR do a fresh `vercel --prod` deploy after pushing.

### TEAM_ACCESS_REQUIRED (git author not in team)
- **Symptom**: Build passes, deployment shows ERROR, `readyStateReason` says "Git author X must have access to the team Y"
- **Root cause**: The git commit author's email doesn't match any team member
- **Fix — Option A (amend git commits)**:
  ```bash
  cd /path/to/repo
  # Check current author email
  git config user.email
  # Set it to match the Vercel team member's email
  git config user.email "verified-team-email@example.com"
  # Amend the last commit with the new author
  git commit --amend --reset-author --no-edit
  # Force push to trigger Vercel redeploy
  git push --force
  ```
  Vercel auto-deploys on push — the new commit's author will match the team and pass the gate.
- **Fix — Option B (add email to team)**: Invite the git author's email as a team member (may require seats on paid plans)

### SSO / deployment protection
- **Symptom**: `ssoProtection.deploymentType` set to `all_except_custom_domains` or stricter
- **Fix**: Adjust in Vercel dashboard → Project Settings → Deployment Protection

## CLI "Unexpected Error" (No Git Integration)

When `vercel deploy --prod` returns `Error: Unexpected error. Please try again later. ()` with no details even after retries:

### Diagnostic checklist
1. **Test if Vercel platform works** — deploy a minimal static HTML file. If it succeeds, the problem is project-specific:
   ```bash
   mkdir /tmp/vtest && echo '<h1>test</h1>' > /tmp/vtest/index.html
   cd /tmp/vtest && vercel --prod --token $TOKEN --scope TEAM_SLUG -y
   ```
2. **Check Node version** — Vercel projects set to `24.x` may fail. Set to `22.x` via API:
   ```bash
   curl -s -X PATCH -H "Authorization: Bearer $TOKEN" \
     "https://api.vercel.com/v9/projects/$PROJ?teamId=$TEAM" \
     -d '{"nodeVersion":"22.x"}'
   ```
3. **Create `.vercelignore`** — if `node_modules/` isn't in `.gitignore` or `.vercelignore`, Vercel CLI tries to upload hundreds of MB, causing silent failures:
   ```bash
   cat > .vercelignore << 'EOF'
   node_modules/
   .git/
   .next/cache/
   EOF
   ```
4. **Try `vercel build` + prebuilt deploy** — this is often **THE definitive fix** when CLI remote builds repeatedly fail with "Unexpected error". Generate `.vercel/output` locally then deploy:
   ```bash
   vercel build --prod --token $TOKEN --scope TEAM_SLUG -y
   vercel deploy --prebuilt --prod --token $TOKEN --scope TEAM_SLUG -y
   ```
5. **Check if project has no Git integration** — CLI-only projects (`source: "cli"`) may behave differently:
   ```bash
   curl -s -H "Authorization: Bearer $TOKEN" \
     "https://api.vercel.com/v9/projects/$PROJ?teamId=$TEAM" \
     | python3 -c "import sys,json; d=json.load(sys.stdin); print('link:', d.get('link',{}).get('type'))"
   ```

## Pitfalls
- The v1/v2 deployment endpoints do NOT return `readyStateReason` — always use v13 for error details
- **Vercel CLI "Unexpected error"** with no details is often caused by: (a) Node 24.x incompatibility, (b) missing `.vercelignore` causing huge uploads, (c) no Git integration on project. Use the diagnostic checklist above.
- Git pushes with embedded HTTPS tokens may timeout from cloud/CI environments. **Workaround**: use `git -c http.version=HTTP/1.1 push --force origin main` — this often succeeds when the default HTTP/2 push times out
- **Next.js tree-shaking with empty env vars**: If `process.env.SOME_KEY` is `''` (empty string) at build time, Next.js statically evaluates it and **tree-shakes the entire code path**. Example: an API route that checks `if (!API_KEY) return error` — if `API_KEY` is empty at build time, the ENTIRE function body after that check is removed from the compiled output. Even after you set the env var and redeploy, the route still returns "API key not configured" because the compiled JS has no LLM call code. **Fix**: Set the env var via Vercel API/Dashboard BEFORE the first build, or delete the env var and recreate it (to clear the cached empty evaluation), then redeploy.
- **Verify the push reached GitHub**: after push, query the GitHub API to confirm the commit SHA and author email are correct:
  ```bash
  TOKEN=$(git remote get-url origin | sed 's|https://||;s|@github.com.*||')
  curl -s -H "Authorization: Bearer $TOKEN" \
    "https://api.github.com/repos/OWNER/REPO/commits/main" | \
    python3 -c "import sys,json; d=json.load(sys.stdin); print(d['sha'][:12], d['commit']['author']['email'])"
  ```
- **Vercel CLI deploy when no GitHub integration**: If the project has no GitHub integration (`source: "cli"` in deployment metadata), auto-deploy won't trigger. Use:
  ```bash
  VERCEL_ORG_ID=team_xxx VERCEL_PROJECT_ID=prj_xxx vercel deploy --prod --token "$VERCEL_TOKEN" --yes --yes
  ```
- `git commit --amend --reset-author --no-edit` only fixes the most recent commit; if multiple commits have the wrong author, use `git rebase -i` with `exec git commit --amend --reset-author --no-edit`
- **After adding env vars via CLI**, redeploy is required: `npx vercel --prod --yes`. The first deploy won't pick up newly added env vars — only subsequent deploys will.
- Deployment events endpoint (`/v2/deployments/{id}/events`) often returns empty `[]`
- Browser access requires login cookies; API tokens only work with the REST API
- Team settings endpoint (`/v1/teams/{id}/settings`) returns 404 on Hobby plan
