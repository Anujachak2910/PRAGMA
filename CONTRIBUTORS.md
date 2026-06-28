# Contributors

PRAGMA was designed and built by a five-person team for the Canara Bank compliance platform initiative.

---

## Anoushka Nag
**GitHub:** [@AnoushkaNag](https://github.com/AnoushkaNag)
**Role:** Product Architect · AI Engineering Lead · Frontend Engineering Lead

Anoushka led the product architecture and drove the most significant technical transformations in the project, including the complete migration from a cloud-dependent Claude API stack to a fully offline, air-gapped architecture.

**Contributions:**

- **Project scaffold and architecture** — Designed the initial repository structure, module boundaries, and the full 5-person ownership model
- **MAP extraction engine** — Implemented the original MAP extraction pipeline and demo fallback mechanism
- **Air-gapped architecture migration** — Led the complete migration from Anthropic Claude API to a local Ollama + rule-based extraction stack, eliminating all external AI dependencies
- **Offline-first compliance intelligence platform** — Implemented the full Ollama integration, model selection strategy (qwen3/phi3.5), async LLM enhancement pipeline, and graceful fallback chain
- **Enterprise design system** — Full dark mode elevation, IBM Plex typography system, Canara Bank brass/navy colour tokens, design token utilities in `index.css`
- **UX overhaul** — Redesigned all pages with consistent panel-header pattern, enterprise density, skeleton loaders, empty states, and WCAG-compliant dark mode contrast
- **Cost Intelligence** — Ideation and implementation leadership for the Compliance Cost Intelligence feature: per-MAP financial burden, department-level cost aggregation, penalty exposure modelling, and ROI quantification
- **Explainable AI / Clause Provenance** — Designed the provenance architecture: Jaccard similarity scoring with clause-anchored sentence search, character-offset highlighting in the Extraction Review panel
- **Regulatory intelligence foundation** — Implemented the Regulatory Diff Engine, Cross-Regulator Conflict Matrix, and Impact Simulator
- **Performance optimisation** — Stale-while-revalidate caching layer (`dataCache.js`), in-flight request deduplication via `fetchOnce()`, lazy code splitting for 9 of 11 pages, poll interval reduction
- **Demo reliability** — Demo reset endpoint, seed data for three realistic regulatory scenarios, provenance computation on reset
- **Final enterprise hardening** — Removed all external API branding, standardised design tokens, eliminated duplicate audit events, verified production build cleanliness

---

## Ashwin Yadav
**GitHub:** [@AshwinYadav816](https://github.com/AshwinYadav816)
**Role:** Frontend Engineer

**Contributions:**

- **Core frontend scaffold** — Built the initial React dashboard layout, MAPs view, approval panel, event log, and upload flow
- **Backend integration** — Wired live backend API calls to all frontend components, implemented MAP status lifecycle controls
- **Loading and error states** — Real backend status indicator, loading spinners, React Error Boundary
- **Design refinements** — Bank-grade premium pass: navy sidebar rail, IBM Plex type system introduction, mono data ledger styling, badge system
- **Dashboard components** — Shared component library including `LifecycleStrip`, `ResolutionFunnel`, `UpcomingDeadlines`
- **Approvals panel** — Async loading, confirmation state management, and status transition UI
- **Register-of-record identity** — Serif masthead, lifecycle hero component, brass design system foundations

---

## Diyasha Nag
**GitHub:** [@Diyaasha](https://github.com/Diyaasha)
**Role:** Backend Engineer

**Contributions:**

- **Backend workflow endpoints** — Implemented the core FastAPI endpoint layer for the MAP and approval workflow
- **Approval workflow** — Complete approval status transitions with validation, status history, and audit event generation
- **Event logging API** — Audit event service and event logging endpoints integrated across all workflow transitions
- **End-to-end workflow integration** — Linked frontend approval actions to backend state machine with full audit trail generation

---

## Diptanshu Vishwa
**GitHub:** [@DiptanshuVishwa](https://github.com/DiptanshuVishwa)
**Role:** Data Architect

**Contributions:**

- **Database layer** — SQLAlchemy ORM models, initial schema design, and database integration setup
- **Backend integration support** — Assisted with backend service wiring and database query layer

---

## Anuja Chakraborty
**GitHub:** [@Anujachak2910](https://github.com/Anujachak2910)
**Role:** Data Pipeline · Test Engineering

**Contributions:**

- **Data pipeline integration** — Built the regulatory feed ingestion service (`feed_service.py`) for proactive circular monitoring
- **Test suite** — Implemented the backend test suite: fixtures, expected output datasets, integration tests, and end-to-end flow tests
- **Test stabilisation** — Fixed test suite compatibility for Python 3.13, patched endpoint mocks, upgraded SQLAlchemy for compatibility
- **UUID and source field fixes** — Resolved UUID ID handling and source field consistency across the data pipeline

---

## Contribution Summary

| Contributor | Commits | Primary Area |
|---|---|---|
| Anoushka Nag | 17 | Architecture · AI · Frontend · Product |
| Ashwin Yadav | 15 | Frontend · Dashboard · UX |
| Anuja Chakraborty | 6 | Data pipeline · Tests |
| Diyasha Nag | 4 | Backend APIs · Approval workflow |
| Diptanshu Vishwa | 2 | Database layer |

_Commit counts from `git shortlog -sn --all` at final submission._
