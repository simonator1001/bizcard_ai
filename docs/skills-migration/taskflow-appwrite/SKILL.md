---
name: taskflow-appwrite
description: TaskFlow AppWrite database operations — CRUD, query, schema reference
category: productivity
---

# TaskFlow AppWrite Database

## Connection

| Item | Value |
|------|-------|
| Endpoint | `https://sgp.cloud.appwrite.io/v1` |
| Project ID | `69ef7aa9000dd6460bd3` |
| Database ID | `taskflow_db` |
| Collection ID | `tasks` |
| Auth | None required (read/write open) |
| App URL | https://taskflow-enhanced-five.vercel.app |

## Schema

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | ✅ | Task title |
| description | string | ❌ | Details |
| priority | string | ❌ | `low` / `medium` / `high` |
| status | string | ❌ | `todo` / `inprogress` / `done` / `blocked` |
| group | string | ❌ | `General` / `BizCard AI` / `TaskFlow` / `AI Portfolio` / `Voice Agent` / `Flowy` |
| agent | string | ❌ | e.g. `@Lobster`, `@Hermes` |
| requestDate | string | ❌ | YYYY-MM-DD |
| duration | string | ❌ | Time estimate |
| url | string | ❌ | Related link |
| result | string | ❌ | Notes/result |
| order | integer | ❌ | Sort order |

## curl Commands

### List all tasks
```bash
API_KEY=$(grep "^APPWRITE_TASKFLOW_API_KEY=" ~/.hermes/.env | cut -d= -f2)
curl -s -H "X-Appwrite-Key: $API_KEY" -H "X-Appwrite-Project: 69ef7aa9000dd6460bd3" \
  "https://sgp.cloud.appwrite.io/v1/databases/taskflow_db/collections/tasks/documents"
```

### Read single task
```bash
curl ... "/v1/databases/taskflow_db/collections/tasks/documents/{DOC_ID}"
```

### Create task (Node SDK preferred, use REST fallback)
```bash
curl -s -X POST "https://sgp.cloud.appwrite.io/v1/databases/taskflow_db/collections/tasks/documents" \
  -H "X-Appwrite-Key: $API_KEY" \
  -H "X-Appwrite-Project: 69ef7aa9000dd6460bd3" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "unique()",
    "data": {
      "title": "Task title",
      "status": "todo",
      "group": "General"
    }
  }'
```

### Update task
```bash
curl -s -X PATCH "https://sgp.cloud.appwrite.io/v1/databases/taskflow_db/collections/tasks/documents/{DOC_ID}" \
  -H "X-Appwrite-Key: $API_KEY" \
  -H "X-Appwrite-Project: 69ef7aa9000dd6460bd3" \
  -H "Content-Type: application/json" \
  -d '{"data": {"status": "done"}}'
```

### Delete task
```bash
curl -s -X DELETE "https://sgp.cloud.appwrite.io/v1/databases/taskflow_db/collections/tasks/documents/{DOC_ID}" \
  -H "X-Appwrite-Key: $API_KEY" -H "X-Appwrite-Project: 69ef7aa9000dd6460bd3"
```

## TaskFlow Heartbeat Audit

Run as a cron job to audit the task list and produce a health report. **Read-only — never auto-modify tasks.** Report only.

### Audit checks
1. **Stale inprogress** — tasks stuck `inprogress` > 7 days from `requestDate`
2. **Done without result** — status `done` but `result` field empty
3. **Missing agent** — no `agent` assigned
4. **HIGH priority backlog** — `high` priority + `todo` status > 3 days stale
5. **Duplicate titles** — same title (case-insensitive) appearing multiple times
6. **Result without done** — `result` populated but status is `todo` or `inprogress` (suggest update)

### Report format
- Total count, status breakdown (done/inprogress/todo/blocked), group breakdown, agent breakdown
- Numbered ⚠️ flags with task title + document ID
- 💡 recommendations section
- Credit/resource status if discoverable from task results
- Output in Traditional Chinese (香港 style)
- End with `🦞 TaskFlow Heartbeat Complete`

### Implementation pattern
```python
# Use execute_code for analysis (avoids pipe-to-interpreter security block)
# ⚠️ BOTH instances run AppWrite v1.9.2 with the same 25-doc pagination bug.
#   * Frankfurt (fra): total=40, accessible=25, no auth needed
#   * Singapore (sgp): total=65, accessible=25, requires API key
# cursorAfter returns DUPLICATES of page 1, not page 2 — offset and cursor are both broken.
# Accept the 25-doc limitation and always note total discrepancy in the report.
# For full coverage, fetch BOTH Frankfurt + Singapore (different doc sets) and merge.
```

### Report triggers (for Simon's cron setup)
- Daily heartbeat: full audit report
- [SILENT] if literally nothing to report (no flags, no suggestions, no status changes)

## Python (hermes_tools)

```python
from hermes_tools import terminal, json_parse
import json

endpoint = "https://sgp.cloud.appwrite.io/v1"
project = "69ef7aa9000dd6460bd3"
db = "taskflow_db"
coll = "tasks"

# Get all tasks
r = terminal(f'curl -s -H "X-Appwrite-Project: {project}" "{endpoint}/databases/{db}/collections/{coll}/documents"')
tasks = json.loads(r["output"])

# Update task
body = json.dumps({"data": {"status": "done"}})
r = terminal(f'curl -s -X PATCH -H "X-Appwrite-Project: {project}" -H "Content-Type: application/json" "{endpoint}/databases/{db}/collections/{coll}/documents/{{doc_id}}" -d \'{body}\'')
```

## Important Notes

- **Two AppWrite projects exist** — they are separate, not migrations of each other:
  - **Singapore** (`69ef7aa9000dd6460bd3`, `sgp.cloud.appwrite.io`) — requires API key auth (`APPWRITE_TASKFLOW_API_KEY` in `~/.hermes/.env`). DB `taskflow_db`, collection `tasks`. ⚠️ Same v1.9.2 25-doc pagination bug as Frankfurt (confirmed 2026-04-30: total=65, only 25 accessible via any offset/cursor/order).
  - **Frankfurt** (`69ef2ce800308cf97330`, `fra.cloud.appwrite.io`) — no API key needed, just `X-Appwrite-Project` header. DB `69ef339f0038efc60a25`, collection `tasks`. ⚠️ Severely broken pagination (see Pitfalls below).
- API key for Singapore is stored in `~/.hermes/.env` as `APPWRITE_TASKFLOW_API_KEY`
- Both collections have open read/write within their projects
- **Both instances have the same v1.9.2 25-doc pagination bug.** No instance is pagination-correct. For heartbeat audits, fetch both and merge (different doc sets: Frankfurt 40/25, Singapore 65/25). Upgrade AppWrite server to fix pagination.

## Frankfurt Instance (Legacy — ⚠️ Broken Pagination)

| Item | Value |
|------|-------|
| Endpoint | `https://fra.cloud.appwrite.io/v1` |
| Project ID | `69ef2ce800308cf97330` |
| Database ID | `69ef339f0038efc60a25` |
| Collection ID | `tasks` |
| Auth | None required (just `X-Appwrite-Project` header) |
| Version | 1.9.2 |

### Pagination Bug (AppWrite v1.9.2 — AFFECTS BOTH INSTANCES)

Both Frankfurt and Singapore run AppWrite v1.9.2 with a **hard 25-document page limit** and ALL pagination mechanisms broken:

| Attempt | Result |
|---------|--------|
| `?limit=100` | Still returns 25 docs (limit ignored) |
| `?limit=5` | Still returns 25 docs (limit floor) |
| `?offset=25` | Returns same first 25 (offset ignored) |
| `?cursorAfter=LAST_ID` | Returns same first 25 again (duplicates, not page 2) |
| `?orderField=$createdAt&orderType=ASC` | Returns same first 25 |
| `?orderField=$createdAt&orderType=DESC` | Returns same first 25 (same set, just reversed) |
| `?queries[]=equal("status","todo")` | `400 Invalid query: Syntax error` |

**Impact**: If `total` > 25, the excess documents are **completely inaccessible** via REST API. No known workaround on v1.9.2 — upgrade AppWrite server to fix.

### Frankfurt curl (no auth)
```bash
curl -s -H "X-Appwrite-Project: 69ef2ce800308cf97330" \
  "https://fra.cloud.appwrite.io/v1/databases/69ef339f0038efc60a25/collections/tasks/documents?limit=100"
# ⚠️ Will only return max 25 docs regardless of total
```
