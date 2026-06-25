# PRAGMA — 4-Minute Demo Script

Run `POST /demo/reset` before every demo run to ensure clean state.

---

## Pre-Demo Checklist (5 minutes before)

- [ ] Backend running at `localhost:8000`
- [ ] Frontend running at `localhost:5173`
- [ ] SQLite database auto-created (no setup required)
- [ ] `POST /demo/reset` executed — clean state confirmed
- [ ] Ollama running (optional — fallback extractor works without it)
- [ ] Browser tab open at the Dashboard
- [ ] Sample RBI circular text ready to paste

---

## Demo Sequence

### 0:00 — Opening (20 seconds)
**Say:**
> "Banks receive dozens of RBI circulars every month. Today, compliance teams read them manually, extract action items by hand, email departments, and track completion in spreadsheets. PRAGMA eliminates that entire process."

---

### 0:20 — Upload a Circular (40 seconds)
1. Navigate to **Circular Upload** page
2. Paste the sample RBI circular into the text area
3. Click **Extract MAPs**
4. Show the loading state — "Claude is analyzing..."

**Say:**
> "We just uploaded a real RBI circular. PRAGMA is now sending it to Claude Sonnet, which will read the regulation and identify every action the bank must take."

---

### 1:00 — MAPs Appear (45 seconds)
1. MAPs table populates automatically
2. Point to: action text, department assignment, priority badge, deadline
3. Highlight that departments were assigned automatically

**Say:**
> "Claude extracted [N] Measurable Action Points — each with a specific action, the responsible department, a priority level, and a deadline inferred from the circular text. No human had to read the regulation. No email was sent. The routing happened automatically."

---

### 1:45 — Compliance Approval (45 seconds)
1. Navigate to **Approval Panel**
2. Show the pending approvals queue
3. Click **Approve** on one MAP — add a brief note
4. Click **Reject** on another — explain why

**Say:**
> "A compliance officer reviews each MAP. They can approve — confirming the action is valid — or reject with a reason. This is the human-in-the-loop checkpoint. The system orchestrates; humans supervise."

---

### 2:30 — Department Completion (40 seconds)
1. Navigate to **MAPs View**
2. Filter by the approved MAP's department
3. Click the MAP, change status to **In Progress**
4. Then mark it **Completed**

**Say:**
> "The IT department — or whichever team is responsible — picks up the approved MAP, marks it in progress, and completes it. Every status change is tracked."

---

### 3:10 — Event Log (30 seconds)
1. Navigate to **Event Log**
2. Scroll through the timeline — show all lifecycle events

**Say:**
> "Every action is captured in an immutable event log. This is your audit trail. If a regulator asks 'what did you do after receiving this circular and when?' — this answers it completely."

---

### 3:40 — Closing (20 seconds)
**Say:**
> "PRAGMA transforms a circular into a tracked, approved, completed workflow — in under 4 minutes. What used to take days, now takes seconds. Thank you."

---

## Fallback: If Claude is slow (> 15 seconds)

Keep talking through the architecture slide while the extraction runs.
Do NOT click away — the response will come.

## Fallback: If Claude fails

The demo reset pre-loads a processed circular with pre-extracted MAPs.
Skip to step 2 (MAPs Appear) and continue from there.

---

## Sample RBI Circular (for demo)

Use the RBI Master Circular on IT Governance or any recent RBI circular.
Keep it under 2000 words for faster extraction.
Anuja maintains the validated set of test circulars in `backend/tests/fixtures/`.
