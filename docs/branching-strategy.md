# PRAGMA — Git Branching Strategy

---

## Branch Structure

```
main
 └── develop
      ├── feature/database-models       (Diptanshu)
      ├── feature/claude-extraction     (Anoushka)
      ├── feature/maps-api              (Diyasha)
      ├── feature/approvals-api         (Diyasha)
      ├── feature/events-api            (Diyasha)
      ├── feature/dashboard             (Ashwin)
      ├── feature/maps-view             (Ashwin)
      ├── feature/approval-panel        (Ashwin)
      ├── feature/event-log             (Ashwin)
      └── feature/demo-polish           (All)
```

---

## Branch Rules

### `main`
- **Always demo-ready.** Never push broken code here.
- Only merge from `develop` when a milestone is complete and tested.
- No direct commits. PRs only.

### `develop`
- Integration branch. This is where everyone's work comes together.
- Should always run (backend starts, frontend renders).
- PRs from feature branches go here.
- One team member reviews each PR before merge.

### `feature/*`
- Branch off from `develop` — not from `main`.
- One feature branch per major task.
- Keep branches short-lived — merge back to `develop` within 1–2 days.
- Name format: `feature/short-description` (lowercase, hyphenated).

---

## Workflow: Making a Change

```bash
# 1. Make sure you're on develop and it's up to date
git checkout develop
git pull origin develop

# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Make changes, commit frequently
git add backend/app/models/map.py
git commit -m "feat: implement MAP SQLAlchemy model"

# 4. Push your branch
git push origin feature/your-feature-name

# 5. Open a PR on GitHub: feature/your-feature-name → develop
```

---

## Commit Message Convention

Use conventional commits — keeps history readable.

```
feat: add MAP extraction endpoint
fix: correct department routing for Treasury MAPs
docs: update API reference with approval endpoint
refactor: extract event logging into its own service
test: add Claude service validation fixtures
```

Format: `type: short description (under 72 chars)`

Types: `feat | fix | docs | refactor | test | chore`

---

## Pull Request Rules

- **Title:** Same format as commit messages
- **Description:** What changed, why, how to test it
- **Reviewer:** At minimum 1 team member must approve
- **No self-merges:** Don't merge your own PR without a review
- **Passing state:** Backend must import cleanly; frontend must render

### PR Template (copy-paste when opening)
```
## What
[One sentence: what this PR adds or changes]

## Why
[Why this change is needed — milestone, unblocks whom]

## How to test
[Steps to verify it works]

## Checklist
- [ ] No .env files committed
- [ ] No console.log / print statements left in
- [ ] Tested locally
```

---

## Pre-Demo Merge Checklist

Before merging `develop` → `main` for the demo:

1. All M0–M4 features merged to `develop`
2. End-to-end demo run passes (follow `docs/demo-script.md`)
3. `POST /demo/reset` clears state correctly
4. No console errors in browser
5. All team members pull latest `main` to their machines

```bash
# Final merge to main
git checkout main
git merge develop --no-ff -m "release: demo-ready build M0-M5"
git push origin main
```

---

## Naming Examples

```
feature/database-models      ✓
feature/claude-extraction     ✓
feature/approval-panel        ✓
Feature/Dashboard             ✗  (no capitals)
my-changes                    ✗  (no feature/ prefix)
fix-stuff                     ✗  (too vague)
```
