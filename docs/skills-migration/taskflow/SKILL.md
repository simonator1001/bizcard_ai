---
name: taskflow
description: TaskFlow project management via AppWrite REST API — create, read, update, delete tasks. Use this whenever Simon gives a new task, asks about task status, or when a task's status changes significantly.
category: productivity
---

# TaskFlow — AppWrite Task Management

## Overview

TaskFlow is Simon's project management system, now backed by **AppWrite** (not localStorage). The live app is at:

**https://taskflow-enhanced-five.vercel.app**

## Connection Info

AppWrite (Singapore region):

| Item | Value |
|------|-------|
| Endpoint | `https://sgp.cloud.appwrite.io/v1` |
| Project ID | `69ef7aa9000dd6460bd3` |
| **Database ID** | **`taskflow_db`** (NOT the project ID!) |
| API Key | `APPWRITE_TASKFLOW_API_KEY` in `~/.hermes/.env` |
| Auth | `X-Appwrite-Key: $API_KEY` + `X-Appwrite-Project: 69ef7aa9000dd6460bd3` |

## Task Data Structure

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Task title |
| `description` | string | Detailed description |
| `priority` | enum | `low` / `medium` / `high` |
| `status` | enum | `todo` / `inprogress` / `done` / `blocked` |
| `group` | string | Project group (see below) |
| `requestDate` | string | Date in `YYYY-MM-DD` format (**required**) |
| `duration` | string | Estimated time (e.g. "2 hours") |
| `url` | string | Related URL |
| `result` | string | Outcome/notes/progress |
| `agent` | string | Who's working on it (e.g. "Lobster") |
| `order` | number | Sort order |

## Groups

`BizCard AI` | `TaskFlow` | `AI Portfolio` | `General` | `Web3` | `Flowy` | `Voice Agent` | `BD Intel` | `Phone Calls` | `Macau`

## API Operations

### Base URL
```
https://sgp.cloud.appwrite.io/v1/databases/taskflow_db/collections/tasks/documents
```

### Header (all requests — use API key)
```
X-Appwrite-Key: $APPWRITE_TASKFLOW_API_KEY
X-Appwrite-Project: 69ef7aa9000dd6460bd3
Content-Type: application/json
```

### Fetch All Tasks
```bash
curl -s "BASE_URL?limit=100" \
  -H "X-Appwrite-Key: $APPWRITE_TASKFLOW_API_KEY" \
  -H "X-Appwrite-Project: 69ef7aa9000dd6460bd3"
```
⚠️ Default page size is 25. Use `limit=100` to get more. Total docs available in `response.total`.

### Create Task
```bash
curl -s -X POST "BASE_URL" \
  -H "X-Appwrite-Key: $APPWRITE_TASKFLOW_API_KEY" \
  -H "X-Appwrite-Project: 69ef7aa9000dd6460bd3" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"unique()","data":{"title":"Task Title","priority":"high","status":"todo","group":"General","requestDate":"2026-04-27"}}'
```

### Update Task
```bash
curl -s -X PUT "BASE_URL/{doc_id}" \
  -H "X-Appwrite-Key: $APPWRITE_TASKFLOW_API_KEY" \
  -H "X-Appwrite-Project: 69ef7aa9000dd6460bd3" \
  -H "Content-Type: application/json" \
  -d '{"data":{"status":"done","result":"Completed successfully"}}'
```

### Delete Task
```bash
curl -s -X DELETE "BASE_URL/{doc_id}" \
  -H "X-Appwrite-Key: $APPWRITE_TASKFLOW_API_KEY" \
  -H "X-Appwrite-Project: 69ef7aa9000dd6460bd3"
```

## Agent Rules

### When Simon gives a new task
1. **Create it in TaskFlow immediately** via the API — don't wait
2. Fill in: title, priority, status (`todo`), group, `requestDate` (today's date), agent (`"Lobster"`)
3. Confirm creation to Simon

### When task status changes
- **Started working** → Update status to `inprogress`
- **Completed** → Update status to `done`, add result summary
- **Blocked** → Update status to `blocked`, note blocker in result
- **Major progress** → Update result field with latest status

### When Simon asks for task review
- Fetch full task list
- Group by status and project
- Highlight blocked/inprogress items
- Note any tasks missing detail

## Pitfalls

- **`requestDate` is required** for creation — forgetting it returns 400 `"Missing required attribute requestDate"`
- **Data must be wrapped**: use `{"documentId":"unique()","data":{...}}` not a flat object
- **Pagination**: default 25 items per page; use `limit=100` or paginate
- **Shell escaping**: When using curl in terminal, avoid `&` in URLs — write a Python script via `write_file` + `terminal` instead for complex operations
- **Update format**: PUT body must also wrap in `{"data":{...}}`, not flat
- **Old localStorage-based TaskFlow** (`taskflow-two-gilt.vercel.app`) is deprecated — use this AppWrite API only
