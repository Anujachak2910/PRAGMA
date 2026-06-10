# PRAGMA — Team Ownership Map

---

## Who Owns What

### Anoushka — AI Lead
**Primary:** `backend/app/services/claude_service.py`
**Secondary:** Circular upload endpoint, overall extraction pipeline

Responsibilities:
- Design and implement the Claude MAP extraction prompt
- Wire claude_service into the POST /circulars/upload endpoint
- Handle Claude API errors and retry logic
- Work with Anuja to iterate on prompt quality
- Own the `feature/claude-extraction` branch

---

### Anuja — Prompt Engineer / Validation
**Primary:** `backend/tests/test_claude_service.py`, prompt design
**Secondary:** `docs/architecture.md` (Prompt Design section)

Responsibilities:
- Build the validation dataset: sample circulars + expected MAP outputs
- Test prompt iterations against the dataset
- Define MAP quality criteria (action specificity, department accuracy, priority accuracy)
- Flag MAP quality regressions when Anoushka iterates the prompt
- Own `backend/tests/fixtures/` directory with sample circulars

---

### Diyasha — Backend Engineer
**Primary:** `backend/app/api/`, `backend/app/services/map_service.py`, `backend/app/services/event_service.py`
**Secondary:** All endpoint implementations

Responsibilities:
- Implement all FastAPI endpoints (circulars, maps, approvals, events, demo)
- Implement map_service and event_service
- Ensure event logging is called on every state transition
- Write integration tests for all endpoints
- Own branches: `feature/maps-api`, `feature/approvals-api`, `feature/events-api`

---

### Diptanshu — Data Architect
**Primary:** `backend/app/models/`, `backend/app/database.py`, `backend/alembic/`
**Secondary:** `backend/app/services/department_service.py`

Responsibilities:
- Implement all SQLAlchemy models
- Write and run the Alembic migration
- Implement department seeding
- Review all schema changes before they hit develop
- Own branch: `feature/database-models`

---

### Ashwin — Frontend Engineer
**Primary:** `frontend/src/`
**Secondary:** Integration with all backend endpoints

Responsibilities:
- Build all React pages (Dashboard, MAPs View, Approval Panel, Event Log, Upload)
- Build reusable components (StatusBadge, MAPCard, EventTimeline, etc.)
- Implement polling hooks (useMAPs, useEvents)
- Connect frontend to all backend API endpoints
- Own branches: `feature/dashboard`, `feature/maps-view`, `feature/approval-panel`, `feature/event-log`

---

## Cross-Cutting Concerns

| Concern | Owner | Reviewer |
|---------|-------|----------|
| `requirements.txt` changes | Anyone | Diptanshu |
| `package.json` changes | Ashwin | Anyone |
| DB schema changes | Diptanshu | Everyone must agree |
| Prompt changes | Anoushka | Anuja validates |
| API contract changes | Diyasha | Ashwin (consumer) must be informed |
| Demo script | Anoushka | Full team rehearsal |

---

## Escalation

If a PR is blocking another team member's work, ping Anoushka to triage.
All schema-breaking changes require a team sync before merging.
