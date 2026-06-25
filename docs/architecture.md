# PRAGMA — System Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        REACT FRONTEND                            │
│  Dashboard │ MAPs View │ Approval Panel │ Event Log              │
└──────────────────────────┬──────────────────────────────────────┘
                           │  REST / JSON  (polls every 30s)
┌──────────────────────────▼──────────────────────────────────────┐
│                      FASTAPI BACKEND                             │
│                                                                  │
│  /circulars  /maps  /approvals  /events  /departments  /demo     │
│                                                                  │
│        ┌────────────────────────────────────────┐               │
│        │         PRAGMA AI ENGINE               │               │
│        │   Ollama (qwen3:8b / phi3.5)           │               │
│        │   → Rule-Based Extractor (fallback)    │               │
│        └────────────────────────────────────────┘               │
└──────────────────────────┬──────────────────────────────────────┘
                           │  SQLAlchemy ORM
┌──────────────────────────▼──────────────────────────────────────┐
│                      SQLITE (WAL mode)                           │
│  circulars │ departments │ maps │ approvals │ events             │
└─────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### Frontend
- React 18 SPA with React Router and lazy-loaded pages
- No server-side rendering — pure client
- Polls `/api/v1/maps` and `/api/v1/events` every 30s
- Tailwind CSS for styling, Recharts for charts
- Stale-while-revalidate cache with 30s TTL

### Backend
- FastAPI with async support
- Routes are thin — all logic in services/
- CORS restricted to localhost origins
- Health check at `/health`

### AI Engine
- Primary: Ollama (qwen3:8b or phi3.5) — local, air-gapped
- Fallback: Rule-based extractor (regex + obligation heuristics)
- Graceful chain: qwen3:8b → phi3.5 → rule-based → mock data
- BackgroundTasks for async LLM enhancement without blocking upload

### Database
- SQLite with WAL journal mode for concurrent reads
- Tables auto-created at startup via `create_all_tables()`
- Events table is append-only (audit trail)
- Departments are seeded at startup — not editable via API

### Provenance
- Jaccard similarity + clause-anchored scoring
- Links each MAP back to the exact source clause
- Traceability score shown in the MAP drawer

---

## Extraction Pipeline

```
Circular Text
      │
      ▼
AI Engine (ai_engine.py)
      │
      ├── Try: Ollama qwen3:8b (structured JSON output)
      ├── Try: Ollama phi3.5 (if qwen3:8b unavailable)
      └── Fallback: rule_extractor.py (regex, zero network)
                │
                ▼
         List[MAPSchema]
                │
                ▼
        map_service.py — persist, route to departments
                │
                ▼
        event_service.py — log extraction event
```

---

## Deployment Notes

- No internet access required at runtime
- No external API keys required
- SQLite database is created automatically on first startup
- Demo state can be reset at any time via `POST /api/v1/demo/reset`
