# PRAGMA — API Reference

Base URL: `http://localhost:8000/api/v1`

All responses are JSON. All IDs are UUIDs.

---

## Circulars

### POST /circulars/upload
Upload a regulatory circular and trigger MAP extraction.

**Request body:**
```json
{
  "title": "RBI Circular on IT Governance",
  "source": "RBI",
  "content": "Full circular text..."
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "title": "...",
  "source": "RBI",
  "status": "processed",
  "uploaded_at": "2024-01-15T10:30:00Z",
  "maps": [ /* array of MAP objects */ ]
}
```

**Response 422:** Validation error (missing fields)
**Response 500:** Claude extraction failed

---

### GET /circulars
List all circulars.

**Response 200:** `[ { id, title, source, status, uploaded_at } ]`

---

### GET /circulars/{id}
Get a single circular with all its MAPs.

**Response 200:** `{ id, title, source, status, uploaded_at, maps: [...] }`
**Response 404:** Circular not found

---

## MAPs

### GET /maps
List all MAPs. Supports query filters.

**Query params:**
- `status` — `Pending | Approved | Rejected | In Progress | Completed`
- `department` — `IT | Compliance | Risk | Treasury | Legal`
- `priority` — `Critical | High | Medium | Low`
- `circular_id` — filter by parent circular

**Response 200:** `[ { id, circular_id, department, action, priority, deadline, status, validation_notes, created_at, updated_at } ]`

---

### GET /maps/{id}
Get a single MAP with its approval history.

**Response 200:** `{ ...map fields, approvals: [...] }`
**Response 404:** MAP not found

---

### PATCH /maps/{id}/status
Department updates MAP progress.

**Request body:**
```json
{ "status": "In Progress" }
```
Only `In Progress` and `Completed` are valid for this endpoint.
Approval transitions go through `POST /approvals`.

**Response 200:** Updated MAP object
**Response 400:** Invalid status transition
**Response 404:** MAP not found

---

## Approvals

### POST /approvals
Compliance officer approves or rejects a MAP.

**Request body:**
```json
{
  "map_id": "uuid",
  "action": "Approved",
  "notes": "Verified against RBI Master Circular — proceed."
}
```

**Response 201:** `{ id, map_id, action, notes, approved_by, created_at }`
**Response 400:** MAP already actioned
**Response 404:** MAP not found

---

### GET /approvals
List all approval records.

**Response 200:** `[ { id, map_id, action, notes, approved_by, created_at } ]`

---

## Events

### GET /events
Retrieve the full lifecycle event log, newest first.

**Query params:**
- `limit` — default 50, max 200
- `offset` — for pagination

**Response 200:**
```json
[
  {
    "id": "uuid",
    "event_type": "maps_extracted",
    "description": "7 MAPs extracted from RBI Circular on IT Governance",
    "actor": "System",
    "circular_id": "uuid | null",
    "map_id": "uuid | null",
    "created_at": "2024-01-15T10:30:05Z"
  }
]
```

**Event types:**
| Type | When |
|------|------|
| `circular_uploaded` | Circular saved to DB |
| `maps_extracted` | Claude extraction complete |
| `map_approved` | Compliance officer approves |
| `map_rejected` | Compliance officer rejects |
| `map_status_changed` | Department updates status |
| `map_completed` | MAP marked complete |
| `demo_reset` | Demo state wiped |

---

## Departments

### GET /departments
List all available departments.

**Response 200:** `[ { id, name } ]`

Fixed values: `IT, Compliance, Risk, Treasury, Legal`

---

## Demo

### POST /demo/reset
Wipe all data (circulars, MAPs, approvals, events) except departments.
Used before every live demo run.

**Response 200:** `{ "message": "Demo state reset successfully." }`

---

## System

### GET /health
**Response 200:** `{ "status": "ok", "service": "PRAGMA API", "version": "0.1.0" }`
