# PRAGMA — System Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        REACT FRONTEND                            │
│  Dashboard │ MAPs View │ Approval Panel │ Event Log              │
│  (Ashwin)                                                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │  REST / JSON  (polls every 5s)
┌──────────────────────────▼──────────────────────────────────────┐
│                      FASTAPI BACKEND                             │
│                                                                  │
│  /circulars  /maps  /approvals  /events  /departments  /demo     │
│  (Diyasha)                                                       │
│                                                                  │
│        ┌────────────────────────────────────────┐               │
│        │         CLAUDE SONNET API               │               │
│        │   MAP Extraction + Department Routing   │               │
│        │   (Anoushka + Anuja)                    │               │
│        └────────────────────────────────────────┘               │
└──────────────────────────┬──────────────────────────────────────┘
                           │  SQLAlchemy ORM
┌──────────────────────────▼──────────────────────────────────────┐
│                      POSTGRESQL                                  │
│  circulars │ departments │ maps │ approvals │ events             │
│  (Diptanshu)                                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### Frontend (Ashwin)
- React 18 SPA with React Router
- No server-side rendering — pure client
- Polls `/api/v1/maps` and `/api/v1/events` every 5 seconds
- Tailwind CSS for styling, Recharts for charts
- AppContext holds minimal global state (active circular, notifications)

### Backend (Diyasha)
- FastAPI with async support
- Routes are thin — all logic in services/
- CORS open for prototype
- Health check at `/health`

### Claude Integration (Anoushka + Anuja)
- Called once per circular upload
- Returns structured JSON: list of MAPs
- Each MAP has: action, department, priority, deadline, validation_notes
- Prompt design: chain-of-thought reasoning → structured JSON output
- Retry once on malformed JSON before raising error

### Database (Diptanshu)
- PostgreSQL with SQLAlchemy 2.0 ORM
- Alembic for migrations — run `alembic upgrade head` on each deploy
- Events table is append-only (audit trail)
- Departments are seeded at startup — not editable via API

---

## Prompt Design (Anoushka + Anuja)

### Strategy: Chain-of-Thought + Structured Output

Claude is asked to:
1. Read and understand the regulatory circular
2. Reason about which actions are required
3. Assign each action to a department from the fixed list: `[IT, Compliance, Risk, Treasury, Legal]`
4. Estimate priority (Critical / High / Medium / Low) based on urgency language
5. Infer deadlines from the circular text (or set null if not stated)
6. Output a strict JSON object — no prose after the JSON block

### Expected Output Shape

```json
{
  "regulation_title": "string",
  "maps": [
    {
      "action": "string — specific, measurable action the bank must take",
      "department": "IT | Compliance | Risk | Treasury | Legal",
      "priority": "Critical | High | Medium | Low",
      "deadline": "YYYY-MM-DD or null",
      "validation_notes": "string — Claude's reasoning for this MAP"
    }
  ]
}
```

### Validation (Anuja's responsibility)
- At least 1 MAP per circular
- All departments must be from the allowed list
- Priority must be one of the four values
- Deadline must be null or a valid date
- action must be > 10 characters

---

## Data Flow: Circular → MAPs

```
User uploads circular text
        ↓
POST /api/v1/circulars/upload
        ↓
circular saved to DB (status: 'pending')
        ↓
claude_service.extract_maps(circular_text)
        ↓
Claude returns JSON
        ↓
map_service.create_maps_from_extraction(db, circular_id, raw_maps)
        ↓
MAPs saved, circular status → 'processed'
        ↓
event_service.log_event('maps_extracted', ...)
        ↓
Frontend polls and displays MAPs
```

---

## Status State Machine

### MAP Statuses
```
Pending ──► Approved ──► In Progress ──► Completed
   │
   └──► Rejected
```

Transitions:
- `Pending → Approved`: Compliance officer approves via POST /approvals
- `Pending → Rejected`: Compliance officer rejects via POST /approvals
- `Approved → In Progress`: Department starts work via PATCH /maps/{id}/status
- `In Progress → Completed`: Department completes via PATCH /maps/{id}/status

---

## Technology Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Frontend polling vs WebSockets | Polling (5s) | Simpler, reliable for prototype, no infra needed |
| Auth | None | Single compliance officer role — adds complexity, zero demo value |
| Background jobs | None | Claude called synchronously — fast enough for demo |
| Real-time updates | Polling | Avoids WebSocket setup complexity |
| Map rendering | Recharts | Lightweight, React-native, good for the stats dashboard |
