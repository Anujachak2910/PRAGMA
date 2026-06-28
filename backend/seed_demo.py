"""
PRAGMA — Demo Database Seeder

Run this once after initial setup to populate the SQLite database with
a realistic demo scenario for judges.

Usage:
    cd backend
    python seed_demo.py

Creates:
  - 5 departments (IT, Compliance, Risk, Treasury, Legal)
  - 3 regulatory circulars (RBI Digital Lending, SEBI Cybersecurity, RBI AML)
  - 14 Measurable Action Points spread across departments
  - 8 audit events showing the lifecycle in action
  - 3 approved MAPs to demonstrate the approval workflow
"""

import sys
import os
from datetime import date, datetime, timedelta

# Ensure we can import from the app package
sys.path.insert(0, os.path.dirname(__file__))

# Load .env before importing settings
from dotenv import load_dotenv
load_dotenv()

from app.database import engine, SessionLocal, create_all_tables
from app.models.circular import Circular
from app.models.map import MAP
from app.models.department import Department
from app.models.event import Event
from app.models.approval import Approval
from app.database import UUIDType


def seed():
    print("=== PRAGMA Demo Seeder ===\n")

    # 1. Create tables
    print("Creating tables...")
    create_all_tables()
    print("✓ Tables ready\n")

    db = SessionLocal()

    try:
        # ── Clear existing data ────────────────────────────────────────────────
        print("Clearing existing data...")
        db.query(Approval).delete()
        db.query(Event).delete()
        db.query(MAP).delete()
        db.query(Circular).delete()
        db.query(Department).delete()
        db.commit()
        print("✓ Cleared\n")

        # ── Departments ────────────────────────────────────────────────────────
        print("Seeding departments...")
        dept_names = ["IT", "Compliance", "Risk", "Treasury", "Legal"]
        depts = {}
        for name in dept_names:
            d = Department(name=name)
            db.add(d)
            depts[name] = d
        db.commit()
        for name in dept_names:
            db.refresh(depts[name])
        print(f"✓ {len(dept_names)} departments seeded\n")

        today = date.today()

        # ── Circular 1: RBI Digital Lending ───────────────────────────────────
        print("Seeding Circular 1: RBI Digital Lending Guidelines...")
        circ1 = Circular(
            title="RBI Master Direction — Digital Lending Guidelines 2024",
            source="RBI",
            content=(
                "Reserve Bank of India\n"
                "Master Direction — Digital Lending\n"
                "RBI/2024-25/112\n\n"
                "To: All Commercial Banks, Small Finance Banks, NBFCs\n\n"
                "CHAPTER I — LOAN DISBURSEMENT\n"
                "Section 5: All digital loan disbursements shall be made exclusively to the "
                "verified bank account of the borrower. Disbursement to any third-party account "
                "is strictly prohibited. Regulated entities shall implement real-time disbursement "
                "controls within 90 days of this circular.\n\n"
                "CHAPTER II — CUSTOMER ONBOARDING\n"
                "Section 7: Regulated entities shall implement Video Customer Identification "
                "Process (V-CIP) for all digital lending customers. KYC records shall be retained "
                "for a minimum of 10 years from loan closure.\n\n"
                "CHAPTER III — TRANSPARENCY\n"
                "Section 8: A Key Fact Statement (KFS) must be provided to the borrower before "
                "loan sanction. The KFS shall disclose the Annual Percentage Rate, total repayment "
                "amount, all fees, and cooling-off period.\n\n"
                "CHAPTER IV — GRIEVANCE REDRESSAL\n"
                "Section 12: Every regulated entity shall designate a nodal Grievance Redressal "
                "Officer for digital lending. All complaints must be resolved within 30 days. "
                "Non-compliance shall attract penal action under RBI Act 1934."
            ),
            status="processed",
            uploaded_at=datetime.utcnow() - timedelta(days=14),
        )
        db.add(circ1)
        db.commit()
        db.refresh(circ1)

        maps1 = [
            MAP(circular_id=circ1.id, department_id=depts["IT"].id,
                action="Implement real-time disbursement controls in the loan origination system to ensure all digital loan disbursals route exclusively to the borrower's verified bank account and block any third-party account transfers",
                priority="Critical", deadline=today + timedelta(days=45),
                status="Approved", validation_notes="Section 5 — Loan Disbursement. Critical: direct customer fund flow risk and explicit 90-day regulatory deadline.",
                created_at=datetime.utcnow() - timedelta(days=14)),
            MAP(circular_id=circ1.id, department_id=depts["Compliance"].id,
                action="Update KYC onboarding workflow to include Video Customer Identification Process (V-CIP) for all digital lending applicants and configure document retention for 10 years post-loan closure",
                priority="Critical", deadline=today + timedelta(days=45),
                status="Approved", validation_notes="Section 7 — Customer Onboarding. Critical: KYC non-compliance carries immediate regulatory risk.",
                created_at=datetime.utcnow() - timedelta(days=14)),
            MAP(circular_id=circ1.id, department_id=depts["Legal"].id,
                action="Revise all digital loan agreement templates to include a mandatory Key Fact Statement disclosing the Annual Percentage Rate, total repayment amount, all fees, and the cooling-off period before loan sanction",
                priority="High", deadline=today + timedelta(days=20),
                status="In Progress", validation_notes="Section 8 — Transparency. High priority: customer protection obligation with legal documentation implications.",
                created_at=datetime.utcnow() - timedelta(days=14)),
            MAP(circular_id=circ1.id, department_id=depts["Compliance"].id,
                action="Designate a nodal Grievance Redressal Officer for digital lending, publish contact details on website and app, and configure complaint tracking with a 30-day SLA alert in the compliance dashboard",
                priority="Medium", deadline=today + timedelta(days=60),
                status="Pending", validation_notes="Section 12 — Grievance Redressal. Medium priority: regulatory requirement with longer implementation window.",
                created_at=datetime.utcnow() - timedelta(days=14)),
            MAP(circular_id=circ1.id, department_id=depts["Risk"].id,
                action="Configure lending platform to disable automatic credit limit enhancements and implement a standalone explicit digital consent flow separate from all other terms communications",
                priority="High", deadline=today + timedelta(days=30),
                status="Pending", validation_notes="Section 6 — Credit Limit Management. High priority: unauthorised credit exposure increases constitute a direct risk event.",
                created_at=datetime.utcnow() - timedelta(days=14)),
        ]
        for m in maps1:
            db.add(m)
        db.commit()
        print(f"  ✓ {len(maps1)} MAPs for Circular 1\n")

        # ── Circular 2: SEBI Cybersecurity Framework ───────────────────────────
        print("Seeding Circular 2: SEBI Cybersecurity Framework...")
        circ2 = Circular(
            title="SEBI Circular — Cybersecurity and Cyber Resilience Framework 2024",
            source="SEBI",
            content=(
                "Securities and Exchange Board of India\n"
                "Circular No. SEBI/HO/ITD/2024/CYB-001\n\n"
                "To: All Stock Exchanges, Depositories, Clearing Corporations\n\n"
                "SECTION A — CYBER RISK GOVERNANCE\n"
                "Para 3.1: Every regulated entity shall establish a Cyber Crisis Management "
                "Plan (CCMP) and submit it to SEBI within 60 days of this circular. The CCMP "
                "shall be reviewed and updated at least annually.\n\n"
                "SECTION B — INCIDENT REPORTING\n"
                "Para 4.2: Regulated entities shall report any cyber security incident to SEBI "
                "within 6 hours of detection. A detailed incident report shall be submitted within "
                "72 hours. Failure to report shall attract penal action.\n\n"
                "SECTION C — VULNERABILITY ASSESSMENT\n"
                "Para 5.1: Regulated entities shall conduct Vulnerability Assessment and Penetration "
                "Testing (VAPT) at least once every 6 months. Reports shall be placed before the "
                "board within 30 days of completion.\n\n"
                "SECTION D — DATA LOCALISATION\n"
                "Para 6.1: All data of Indian investors shall be stored within India only. "
                "Regulated entities using cloud services shall ensure data localisation compliance "
                "immediately."
            ),
            status="processed",
            uploaded_at=datetime.utcnow() - timedelta(days=7),
        )
        db.add(circ2)
        db.commit()
        db.refresh(circ2)

        maps2 = [
            MAP(circular_id=circ2.id, department_id=depts["IT"].id,
                action="Develop and submit a Cyber Crisis Management Plan (CCMP) to SEBI covering incident detection, response procedures, communication protocols, and recovery strategies",
                priority="Critical", deadline=today + timedelta(days=53),
                status="Pending", validation_notes="Para 3.1 — Cyber Risk Governance. Critical: explicit 60-day SEBI submission deadline with board oversight requirement.",
                created_at=datetime.utcnow() - timedelta(days=7)),
            MAP(circular_id=circ2.id, department_id=depts["IT"].id,
                action="Implement automated cyber incident detection and reporting pipeline to enable SEBI notification within 6 hours and detailed incident report submission within 72 hours of any security breach",
                priority="Critical", deadline=today + timedelta(days=14),
                status="Pending", validation_notes="Para 4.2 — Incident Reporting. Critical: 6-hour reporting window with immediate penal action for non-compliance.",
                created_at=datetime.utcnow() - timedelta(days=7)),
            MAP(circular_id=circ2.id, department_id=depts["Risk"].id,
                action="Schedule and conduct Vulnerability Assessment and Penetration Testing (VAPT) and establish a bi-annual VAPT calendar with board reporting within 30 days of each assessment",
                priority="High", deadline=today + timedelta(days=90),
                status="Pending", validation_notes="Para 5.1 — Vulnerability Assessment. High priority: mandatory bi-annual requirement with board-level reporting.",
                created_at=datetime.utcnow() - timedelta(days=7)),
            MAP(circular_id=circ2.id, department_id=depts["Compliance"].id,
                action="Audit all cloud service providers to verify data localisation compliance and ensure all Indian investor data is stored within Indian data centres with immediate effect",
                priority="Critical", deadline=today + timedelta(days=7),
                status="Pending", validation_notes="Para 6.1 — Data Localisation. Critical: immediate compliance required; cloud data sovereignty violation risk.",
                created_at=datetime.utcnow() - timedelta(days=7)),
        ]
        for m in maps2:
            db.add(m)
        db.commit()
        print(f"  ✓ {len(maps2)} MAPs for Circular 2\n")

        # ── Circular 3: RBI AML/KYC Master Direction ───────────────────────────
        print("Seeding Circular 3: RBI AML/KYC Master Direction...")
        circ3 = Circular(
            title="RBI Master Direction — Know Your Customer (KYC) and Anti-Money Laundering 2024",
            source="RBI",
            content=(
                "Reserve Bank of India\n"
                "Master Direction — Know Your Customer (KYC) Direction, 2016 (Updated 2024)\n"
                "RBI/2024-25/87\n\n"
                "PART A — CUSTOMER DUE DILIGENCE\n"
                "Section 16: Banks shall implement Risk-Based Customer Due Diligence (CDD). "
                "Politically Exposed Persons (PEPs) shall be classified as High Risk and subject "
                "to Enhanced Due Diligence (EDD). Banks shall update PEP screening lists monthly.\n\n"
                "PART B — TRANSACTION MONITORING\n"
                "Section 23: Banks shall implement automated transaction monitoring systems capable "
                "of detecting structuring, layering, and smurfing patterns. Suspicious Transaction "
                "Reports (STRs) shall be filed within 7 days of detection.\n\n"
                "PART C — RECORD KEEPING\n"
                "Section 31: All KYC records shall be retained for at least 5 years after "
                "the end of the banking relationship. Records shall be in a format readily "
                "accessible to regulators within 48 hours of request.\n\n"
                "PART D — REPORTING OBLIGATIONS\n"
                "Section 35: Banks shall submit a quarterly AML compliance report to the "
                "Financial Intelligence Unit (FIU-IND). The first report for the current quarter "
                "is due within 30 days."
            ),
            status="processed",
            uploaded_at=datetime.utcnow() - timedelta(days=3),
        )
        db.add(circ3)
        db.commit()
        db.refresh(circ3)

        maps3 = [
            MAP(circular_id=circ3.id, department_id=depts["Compliance"].id,
                action="Implement Risk-Based Customer Due Diligence framework with PEP screening, classify Politically Exposed Persons as High Risk, and establish monthly PEP list update procedures",
                priority="High", deadline=today + timedelta(days=30),
                status="Pending", validation_notes="Section 16 — Customer Due Diligence. High priority: mandatory RBI KYC obligation with monthly cadence.",
                created_at=datetime.utcnow() - timedelta(days=3)),
            MAP(circular_id=circ3.id, department_id=depts["IT"].id,
                action="Deploy automated transaction monitoring system capable of detecting structuring, layering, and smurfing patterns and generate Suspicious Transaction Report (STR) alerts within 7 days of detection",
                priority="Critical", deadline=today + timedelta(days=60),
                status="Pending", validation_notes="Section 23 — Transaction Monitoring. Critical: STR filing within 7 days is a hard regulatory deadline; failure constitutes AML violation.",
                created_at=datetime.utcnow() - timedelta(days=3)),
            MAP(circular_id=circ3.id, department_id=depts["Compliance"].id,
                action="Audit KYC record retention infrastructure to confirm 5-year retention policy and verify that records can be produced to regulators in accessible format within 48 hours of request",
                priority="Medium", deadline=today + timedelta(days=45),
                status="Pending", validation_notes="Section 31 — Record Keeping. Medium priority: existing systems likely partially compliant; gap analysis required.",
                created_at=datetime.utcnow() - timedelta(days=3)),
            MAP(circular_id=circ3.id, department_id=depts["Compliance"].id,
                action="Prepare and submit quarterly AML compliance report to Financial Intelligence Unit (FIU-IND) covering the current quarter within 30 days",
                priority="High", deadline=today + timedelta(days=28),
                status="Pending", validation_notes="Section 35 — Reporting Obligations. High priority: hard FIU-IND submission deadline with regulatory consequence.",
                created_at=datetime.utcnow() - timedelta(days=3)),
            MAP(circular_id=circ3.id, department_id=depts["Risk"].id,
                action="Establish AML risk scoring model for transaction monitoring alerts and calibrate thresholds to reduce false positives while maintaining detection sensitivity for high-risk patterns",
                priority="Medium", deadline=today + timedelta(days=90),
                status="Pending", validation_notes="Section 23 — Transaction Monitoring (supplementary). Medium priority: risk model quality directly impacts STR accuracy.",
                created_at=datetime.utcnow() - timedelta(days=3)),
        ]
        for m in maps3:
            db.add(m)
        db.commit()
        print(f"  ✓ {len(maps3)} MAPs for Circular 3\n")

        # ── Approvals (for already-approved MAPs) ──────────────────────────────
        all_maps = maps1 + maps2 + maps3
        approved_maps = [m for m in all_maps if m.status in ("Approved", "In Progress")]

        for m in approved_maps:
            db.refresh(m)
            approval = Approval(
                map_id=m.id,
                action="Approved",
                notes="Reviewed and cleared for immediate implementation. Priority escalated to compliance team.",
                approved_by="Compliance Officer",
                created_at=datetime.utcnow() - timedelta(days=10),
            )
            db.add(approval)
        db.commit()
        print(f"✓ {len(approved_maps)} approval records created\n")

        # ── Audit Events ───────────────────────────────────────────────────────
        print("Seeding audit events...")
        events = [
            Event(circular_id=circ1.id, event_type="circular_uploaded",
                  description="RBI Master Direction — Digital Lending Guidelines 2024 uploaded",
                  actor="System", created_at=datetime.utcnow() - timedelta(days=14)),
            Event(circular_id=circ1.id, event_type="maps_extracted",
                  description="5 MAPs extracted and routed to departments via Local AI Engine",
                  actor="System", created_at=datetime.utcnow() - timedelta(days=14)),
            Event(circular_id=circ1.id, map_id=maps1[0].id, event_type="map_approved",
                  description="MAP approved: Implement real-time disbursement controls",
                  actor="Compliance Officer", created_at=datetime.utcnow() - timedelta(days=12)),
            Event(circular_id=circ1.id, map_id=maps1[1].id, event_type="map_approved",
                  description="MAP approved: V-CIP KYC onboarding implementation",
                  actor="Compliance Officer", created_at=datetime.utcnow() - timedelta(days=12)),
            Event(circular_id=circ1.id, map_id=maps1[2].id, event_type="map_status_changed",
                  description="MAP status changed to In Progress: Key Fact Statement template revision",
                  actor="Legal", created_at=datetime.utcnow() - timedelta(days=8)),
            Event(circular_id=circ2.id, event_type="circular_uploaded",
                  description="SEBI Circular — Cybersecurity and Cyber Resilience Framework 2024 uploaded",
                  actor="System", created_at=datetime.utcnow() - timedelta(days=7)),
            Event(circular_id=circ2.id, event_type="maps_extracted",
                  description="4 MAPs extracted and routed to departments via Local AI Engine",
                  actor="System", created_at=datetime.utcnow() - timedelta(days=7)),
            Event(circular_id=circ3.id, event_type="circular_uploaded",
                  description="RBI Master Direction — KYC and Anti-Money Laundering 2024 uploaded",
                  actor="System", created_at=datetime.utcnow() - timedelta(days=3)),
            Event(circular_id=circ3.id, event_type="maps_extracted",
                  description="5 MAPs extracted and routed to departments via Local AI Engine",
                  actor="System", created_at=datetime.utcnow() - timedelta(days=3)),
        ]
        for e in events:
            db.add(e)
        db.commit()
        print(f"✓ {len(events)} audit events seeded\n")

        # ── Summary ────────────────────────────────────────────────────────────
        total_maps = len(maps1) + len(maps2) + len(maps3)
        print("=" * 50)
        print("DEMO DATABASE READY")
        print("=" * 50)
        print(f"  Departments:  {len(dept_names)}")
        print(f"  Circulars:    3 (RBI ×2, SEBI ×1)")
        print(f"  MAPs:         {total_maps} total")
        print(f"    Critical:   {sum(1 for m in maps1+maps2+maps3 if m.priority == 'Critical')}")
        print(f"    High:       {sum(1 for m in maps1+maps2+maps3 if m.priority == 'High')}")
        print(f"    Medium:     {sum(1 for m in maps1+maps2+maps3 if m.priority == 'Medium')}")
        print(f"  Approved:     {len(approved_maps)}")
        print(f"  Audit Events: {len(events)}")
        print()
        print("Start backend:  uvicorn app.main:app --reload --port 8000")
        print("=" * 50)

    except Exception as e:
        db.rollback()
        print(f"\n✗ Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
