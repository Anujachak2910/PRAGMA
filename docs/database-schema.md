# PRAGMA — Database Schema

Owner: Diptanshu (Database Design)
Milestone: M1

---

## Tables

### circulars
Stores regulatory circulars uploaded into the system.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | `gen_random_uuid()` |
| title | TEXT NOT NULL | Display name |
| source | TEXT NOT NULL | `'RBI' \| 'SEBI' \| 'MCA'` |
| content | TEXT NOT NULL | Full circular text sent to Claude |
| status | TEXT | `'pending' \| 'processed' \| 'failed'` |
| uploaded_at | TIMESTAMPTZ | Server default: `now()` |

---

### departments
Seeded at startup. Not editable via API.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT UNIQUE | `IT \| Compliance \| Risk \| Treasury \| Legal` |

---

### maps
Measurable Action Points extracted from a circular.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| circular_id | UUID FK → circulars | `ON DELETE CASCADE` |
| department_id | UUID FK → departments | Nullable (routing may fail) |
| action | TEXT NOT NULL | What the bank must do |
| priority | TEXT NOT NULL | `Critical \| High \| Medium \| Low` |
| deadline | DATE | Nullable — inferred from circular |
| status | TEXT | Default: `'Pending'` |
| validation_notes | TEXT | Claude reasoning + Anuja's notes |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | Auto-update via ORM |

**Valid status transitions:**
```
Pending → Approved → In Progress → Completed
Pending → Rejected
```

---

### approvals
Immutable approval records. One row per compliance decision.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| map_id | UUID FK → maps | `ON DELETE CASCADE` |
| action | TEXT NOT NULL | `'Approved' \| 'Rejected'` |
| notes | TEXT | Compliance officer comment |
| approved_by | TEXT | Default: `'Compliance Officer'` |
| created_at | TIMESTAMPTZ | |

---

### events
Append-only audit log. Never update or delete rows.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| circular_id | UUID FK → circulars | `ON DELETE SET NULL` |
| map_id | UUID FK → maps | `ON DELETE SET NULL` |
| event_type | TEXT NOT NULL | See valid types below |
| description | TEXT NOT NULL | Human-readable |
| actor | TEXT | Default: `'System'` |
| created_at | TIMESTAMPTZ | |

**Valid event_type values:**
`circular_uploaded | maps_extracted | map_approved | map_rejected | map_status_changed | map_completed | map_assigned | demo_reset`

---

## Entity Relationships

```
circulars (1) ──── (many) maps
maps (1)      ──── (many) approvals
maps (1)      ──── (many) events
circulars (1) ──── (many) events
departments (1)─── (many) maps
```

---

## Alembic Commands

```bash
# Create a new migration
alembic revision --autogenerate -m "your migration description"

# Apply all pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1

# View migration history
alembic history
```

---

## Seed Data

The following departments are seeded at startup by `department_service.seed_departments()`:

- IT
- Compliance
- Risk
- Treasury
- Legal
