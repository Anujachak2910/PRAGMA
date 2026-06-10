# PRAGMA — GitHub Issues Backlog

Copy these into GitHub Issues. Assign milestone labels: M0, M1, M2, M3, M4, M5.

---

## M0 — Foundations

### #1 — Initialize backend: FastAPI skeleton + Alembic
**Owner:** Diptanshu
**Milestone:** M0
**Description:**
Set up the backend folder structure, FastAPI app factory, Alembic config, and verify the health check returns 200.
**Acceptance criteria:**
- `python run.py` starts without errors
- `GET /health` returns `{"status": "ok"}`
- `alembic upgrade head` runs without errors (empty migration OK)
**Dependencies:** None

---

### #2 — Initialize frontend: Vite + React + Tailwind
**Owner:** Ashwin
**Milestone:** M0
**Description:**
Scaffold the React frontend with Vite, install all dependencies, configure Tailwind, and verify the placeholder screen renders.
**Acceptance criteria:**
- `npm run dev` starts without errors
- PRAGMA placeholder renders at localhost:3000
- Tailwind classes apply correctly (check primary color)
**Dependencies:** None

---

### #3 — Create PostgreSQL database and verify connection
**Owner:** Diptanshu
**Milestone:** M0
**Description:**
Create the `pragma_db` database, verify SQLAlchemy connects, write basic DB connection test.
**Acceptance criteria:**
- `pragma_db` exists in PostgreSQL
- `database.py` connects successfully on startup
- No connection error when running `python run.py`
**Dependencies:** #1

---

### #4 — Initial Git commit and branch setup
**Owner:** Anoushka
**Milestone:** M0
**Description:**
Create the initial commit, push to GitHub, create the `develop` branch, and confirm all team members can clone and run.
**Acceptance criteria:**
- `.gitignore` present and correct
- `develop` branch exists on remote
- All 5 team members have cloned the repo
- README instructions work end-to-end
**Dependencies:** #1, #2

---

## M1 — Database & Models

### #5 — Implement all SQLAlchemy ORM models
**Owner:** Diptanshu
**Milestone:** M1
**Description:**
Implement `Circular`, `Department`, `MAP`, `Approval`, `Event` models following the schema in `docs/database-schema.md`. Include all relationships.
**Acceptance criteria:**
- All 5 models defined with correct columns and relationships
- `models/__init__.py` imports all models
- Alembic autogenerate detects all tables
**Dependencies:** #3

---

### #6 — Write and run Alembic migration
**Owner:** Diptanshu
**Milestone:** M1
**Description:**
Generate the initial migration from the ORM models. Run it and confirm all 5 tables exist in PostgreSQL.
**Acceptance criteria:**
- `alembic revision --autogenerate -m "initial schema"` generates correct SQL
- `alembic upgrade head` creates all tables
- Tables verified via `\dt` in psql
**Dependencies:** #5

---

### #7 — Seed department data on startup
**Owner:** Diptanshu
**Milestone:** M1
**Description:**
Implement `department_service.seed_departments()` and call it on FastAPI startup. Insert IT, Compliance, Risk, Treasury, Legal if the table is empty.
**Acceptance criteria:**
- Running the app twice does not duplicate departments
- `GET /departments` returns 5 departments
**Dependencies:** #5, #6

---

### #8 — Design and validate Claude MAP extraction prompt
**Owner:** Anoushka + Anuja
**Milestone:** M1
**Description:**
Design the system + user prompt for MAP extraction. Anuja tests against 3 sample RBI circulars and confirms output quality meets the MAP schema.
**Acceptance criteria:**
- Prompt produces valid JSON on 3/3 test circulars
- All departments in output are from the allowed list
- At least 3 MAPs extracted per circular
- Anuja signs off on output quality
**Dependencies:** None (parallel with #5, #6)

---

## M2 — Core APIs

### #9 — Implement POST /circulars/upload
**Owner:** Anoushka + Diyasha
**Milestone:** M2
**Description:**
Full upload pipeline: save circular → call claude_service → create MAPs → log events → return response.
**Acceptance criteria:**
- POST with valid circular creates a processed circular + MAPs in DB
- Events logged: `circular_uploaded`, `maps_extracted`
- Returns 201 with circular object including MAPs array
- Handles Claude failure gracefully (circular status → 'failed')
**Dependencies:** #6, #7, #8

---

### #10 — Implement GET /maps with filters
**Owner:** Diyasha
**Milestone:** M2
**Description:**
List endpoint with optional query filters: status, department, priority, circular_id.
**Acceptance criteria:**
- Returns all MAPs when no filters applied
- Each filter works independently and in combination
- Response includes department name (not just ID)
**Dependencies:** #9

---

### #11 — Implement POST /approvals
**Owner:** Diyasha
**Milestone:** M2
**Description:**
Compliance officer approves or rejects a MAP. Updates MAP status, creates approval record, logs event.
**Acceptance criteria:**
- Approving a Pending MAP sets status → Approved
- Rejecting a Pending MAP sets status → Rejected
- Approval record created with notes
- Event logged: `map_approved` or `map_rejected`
- Returns 400 if MAP is already actioned
**Dependencies:** #10

---

### #12 — Implement PATCH /maps/{id}/status
**Owner:** Diyasha
**Milestone:** M2
**Description:**
Department updates MAP from Approved → In Progress → Completed.
**Acceptance criteria:**
- Only valid transitions accepted (see state machine in docs/architecture.md)
- Event logged on each transition
- Returns 400 on invalid transition
**Dependencies:** #11

---

### #13 — Implement GET /events
**Owner:** Diyasha
**Milestone:** M2
**Description:**
Return full event log sorted by created_at DESC. Support limit/offset pagination.
**Acceptance criteria:**
- Events returned newest first
- limit and offset query params work
- Each event includes circular_id and map_id if applicable
**Dependencies:** #9

---

## M3 — React Dashboard

### #14 — Build layout: Sidebar + TopBar + routing
**Owner:** Ashwin
**Milestone:** M3
**Description:**
Build the main dashboard layout with sidebar navigation and top bar. Set up React Router routes for all pages.
**Acceptance criteria:**
- Sidebar links work for all 5 pages
- Active route is highlighted in sidebar
- Responsive on 1280px+ screens
**Dependencies:** #2 (frontend scaffold)

---

### #15 — Build Dashboard page: stats + recent MAPs
**Owner:** Ashwin
**Milestone:** M3
**Description:**
Overview page with: total MAPs by status (counts), priority distribution chart, recent MAPs list.
**Acceptance criteria:**
- Stats cards update when backend data changes
- Recharts bar/pie chart renders correctly
- Dashboard polls every 5 seconds
**Dependencies:** #10, #14

---

### #16 — Build MAPs View: full table + filters
**Owner:** Ashwin
**Milestone:** M3
**Description:**
Table showing all MAPs with filterable columns (status, department, priority). Status badges with colour coding.
**Acceptance criteria:**
- All MAPs load and display correctly
- Filters work client-side or via API query params
- StatusBadge component uses colours from constants.js
**Dependencies:** #10, #14

---

### #17 — Build Approval Panel
**Owner:** Ashwin
**Milestone:** M3
**Description:**
Shows pending MAPs as cards. Compliance officer can approve or reject each with an optional note.
**Acceptance criteria:**
- Only Pending MAPs shown
- Approve/Reject buttons call POST /approvals
- After action, MAP disappears from panel
- Success feedback shown to user
**Dependencies:** #11, #14

---

### #18 — Build Event Log page
**Owner:** Ashwin
**Milestone:** M3
**Description:**
Timeline view of all lifecycle events. Newest first. Shows event type, description, actor, timestamp.
**Acceptance criteria:**
- Events load and display in timeline format
- Auto-refreshes every 5 seconds
- Empty state shown when no events
**Dependencies:** #13, #14

---

### #19 — Build Circular Upload page
**Owner:** Ashwin + Anoushka
**Milestone:** M3
**Description:**
Form with: title input, source selector (RBI/SEBI/MCA), text area for circular content. Submit triggers extraction.
**Acceptance criteria:**
- Form validation before submit
- Loading state shown during extraction (can take 10–15s)
- On success: navigate to MAPs View filtered by the new circular
- On error: show error message
**Dependencies:** #9, #14

---

## M4 — Integration & Polish

### #20 — Implement POST /demo/reset
**Owner:** Diyasha
**Milestone:** M4
**Description:**
Truncate circulars, maps, approvals, events (keep departments). Optionally re-insert a seed circular.
**Acceptance criteria:**
- After reset: GET /maps returns empty array
- GET /events returns empty array
- Departments still present
- Callable from a button in the frontend (or via curl)
**Dependencies:** #13

---

### #21 — End-to-end integration test
**Owner:** All team
**Milestone:** M4
**Description:**
Run the full demo script from docs/demo-script.md. Fix any integration bugs found.
**Acceptance criteria:**
- Full 4-minute demo script completes without errors
- No console errors in browser
- Event log reflects correct lifecycle after demo
**Dependencies:** #19, #20

---

### #22 — Demo polish: loading states + error handling + empty states
**Owner:** Ashwin
**Milestone:** M4
**Description:**
Add loading spinners on all data-fetching components. Add error states. Add empty state illustrations.
**Acceptance criteria:**
- No blank screens during loading
- API errors shown as user-friendly messages
- Empty state shown when no MAPs / no events
**Dependencies:** #15, #16, #17, #18, #19

---

## M5 — Demo Rehearsal

### #23 — Full team demo rehearsal
**Owner:** Anoushka (facilitator)
**Milestone:** M5
**Description:**
Complete 2 dry runs of the demo. Time it. Fix any timing or UX issues found.
**Acceptance criteria:**
- Demo completes in under 4 minutes
- All 5 team members know their parts
- Fallback plan rehearsed (Claude slow / error scenario)
**Dependencies:** #22

---

## Dependency Graph

```
#4 (Git setup)
  └─ depends on: #1, #2

#5 (Models)
  └─ depends on: #3

#6 (Migration)
  └─ depends on: #5

#7 (Seed)
  └─ depends on: #5, #6

#9 (Upload endpoint)
  └─ depends on: #6, #7, #8

#10, #11, #12, #13
  └─ depends on: #9

#14 (Layout)
  └─ depends on: #2

#15–#19 (Pages)
  └─ depends on: #10–#13, #14

#20 (Reset)
  └─ depends on: #13

#21 (Integration test)
  └─ depends on: #19, #20

#22 (Polish)
  └─ depends on: #15–#19

#23 (Rehearsal)
  └─ depends on: #22
```
