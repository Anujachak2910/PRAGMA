# PRAGMA
### Proactive Regulatory Autonomous Governance & Management Agent

> **SuRaksha Cyber Hackathon 2.0 — Canara Bank**
> Theme: Agentic Regulatory Intelligence & Compliance

---

## Problem Statement

Banks manually process RBI, SEBI, and MCA regulatory circulars.

The current process:
- Read dense regulations manually
- Identify required actions
- Determine responsible departments
- Route tasks through emails
- Track completion manually
- Prepare evidence during audits

This process is **slow, fragmented, and error-prone.** Compliance gaps emerge not from negligence but from the absence of a structured, automated workflow.

---

## What PRAGMA Does

PRAGMA transforms regulatory circulars into **Measurable Action Points (MAPs)**, routes them to the correct departments, tracks their progress, and maintains a full lifecycle event log — all with a compliance officer in the loop.

### Core Differentiator

Most teams build dashboards, chatbots, and summarizers.

PRAGMA goes further:

| Step | What PRAGMA Does |
|------|-----------------|
| 1 | Ingests a regulatory circular |
| 2 | Claude AI extracts Measurable Action Points (MAPs) |
| 3 | MAPs auto-routed to responsible departments |
| 4 | Compliance officer reviews and approves each MAP |
| 5 | Department marks completion |
| 6 | Full audit trail maintained in the event log |

> **Humans supervise. The system orchestrates.**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Recharts |
| Backend | FastAPI, Python 3.11+ |
| Database | PostgreSQL 15 |
| AI | Claude Sonnet (Anthropic API) |
| ORM / Migrations | SQLAlchemy 2.0 + Alembic |

---

## Team

| Name | Role | Ownership |
|------|------|-----------|
| Anoushka | AI Lead | LLM pipeline, MAP extraction, Claude orchestration |
| Anuja | Prompt Engineer | Prompt design, test datasets, MAP quality validation |
| Diyasha | Backend Engineer | FastAPI routes, event logging, approval workflow |
| Diptanshu | Data Architect | PostgreSQL schema, SQLAlchemy models, migrations |
| Ashwin | Frontend Engineer | React dashboard, UI/UX, frontend integration |

---

## Repository Structure

```
PRAGMA/
├── backend/                        # FastAPI application
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── router.py       # Aggregates all endpoint routers
│   │   │       └── endpoints/      # One file per resource
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── services/               # Business logic layer
│   │   │   ├── claude_service.py   # Claude API + MAP extraction
│   │   │   ├── map_service.py      # MAP creation and routing
│   │   │   └── event_service.py    # Audit event logging
│   │   ├── utils/                  # Shared helpers
│   │   ├── config.py               # App settings via pydantic-settings
│   │   ├── database.py             # SQLAlchemy engine + session
│   │   └── main.py                 # FastAPI app factory
│   ├── alembic/                    # Database migrations
│   ├── tests/                      # Backend test suite
│   ├── requirements.txt
│   ├── alembic.ini
│   └── .env.example
│
├── frontend/                       # React application
│   └── src/
│       ├── api/                    # Backend API call functions
│       ├── components/             # Reusable UI components
│       ├── contexts/               # React global state
│       ├── hooks/                  # Custom React hooks
│       ├── layouts/                # Page layout wrappers
│       ├── pages/                  # Route-level page components
│       ├── services/               # Axios instance
│       └── utils/                  # Constants, formatters
│
├── docs/                           # Architecture, API reference, demo script
│   ├── architecture.md
│   ├── api-reference.md
│   ├── database-schema.md
│   ├── demo-script.md
│   ├── github-issues.md
│   ├── branching-strategy.md
│   └── team-ownership.md
│
└── presentation/                   # Hackathon slides
```

---

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### 1. Clone the repository

```bash
git clone https://github.com/AnoushkaNag/PRAGMA.git
cd PRAGMA
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate — Windows
.\venv\Scripts\activate
# Activate — macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Open .env and set DATABASE_URL and ANTHROPIC_API_KEY

# Run database migrations
alembic upgrade head

# Start development server
python run.py
```

Backend runs at: `http://localhost:8000`
Swagger docs: `http://localhost:8000/docs`

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

### 4. Database

```bash
# Create the PostgreSQL database
createdb pragma_db

# Or with psql
psql -U postgres -c "CREATE DATABASE pragma_db;"
```

---

## Development Workflow

See [docs/branching-strategy.md](docs/branching-strategy.md) for the full Git workflow.

**Quick reference:**
1. Branch from `develop`: `git checkout -b feature/your-feature develop`
2. Build and test your feature
3. Open a PR to `develop`
4. One team member reviews and merges
5. Before demo: merge `develop` → `main`

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System design and component overview |
| [API Reference](docs/api-reference.md) | All backend endpoints |
| [Database Schema](docs/database-schema.md) | PostgreSQL tables and relationships |
| [Demo Script](docs/demo-script.md) | 4-minute demo runbook |
| [GitHub Issues](docs/github-issues.md) | Full sprint backlog |
| [Team Ownership](docs/team-ownership.md) | Who owns what |

---

*SuRaksha Cyber Hackathon 2.0 — Internal prototype. Not for production use.*
