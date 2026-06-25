// PRAGMA — Comprehensive demo data
// Shapes match live API contracts exactly. Used when backend is unreachable.
// All events use `created_at` (not `timestamp`).
// Extended fields (clause_text, reasoning, risk, evidence_docs) used by
// TraceabilityDrawer (Phase 2) and RiskPanel (Phase 3).

export const MOCK_CIRCULARS = [
  {
    id: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890',
    title: 'RBI Cybersecurity Framework for Banks 2026',
    source: 'RBI',
    created_at: '2026-06-21T09:55:00',
    maps_count: 6,
    content: `RBI/2026-27/DEP.CISA.No.123/08.03.001/2026-27
June 21, 2026

MASTER DIRECTION
To,
The Chief Executive Officers / Managing Directors
All Scheduled Commercial Banks (including Small Finance Banks and Payments Banks)

Dear Sir/Madam,

Master Direction on Cybersecurity Framework for Banks — 2026 Revision

In exercise of the powers conferred by Section 35A of the Banking Regulation Act, 1949, the Reserve Bank of India hereby issues the following Master Direction to all Scheduled Commercial Banks on Cybersecurity.

§ 4.2.1 — Authentication Controls
Banks shall implement multi-factor authentication (MFA) for all privileged users accessing Core Banking Solutions (CBS), Internet Banking, Treasury Systems, SWIFT Gateway, and any critical payment infrastructure. This requirement shall be complied with within 90 days of issuance of this circular. MFA solutions must use TOTP, hardware tokens, or biometric verification. OTP via SMS is not acceptable for privileged access. Banks shall maintain logs of all MFA events for a period of 3 years.

§ 4.4 — Data Protection & Privacy
Banks shall implement Data Loss Prevention (DLP) controls across all endpoints, email gateways, and cloud upload channels to prevent unauthorized exfiltration of customer Personally Identifiable Information (PII), account data, and transaction records. DLP policies shall be reviewed by the Legal and Compliance team before deployment and updated annually. The DLP system must generate alerts for any policy violation within 60 seconds.

§ 5.3.2 — Vulnerability Management
Banks shall conduct comprehensive vulnerability assessments and penetration testing of all internet-facing applications, mobile banking platforms, and API gateways on a quarterly basis. All testing shall be performed by vendors empanelled with CERT-In. Test results and remediation plans shall be placed before the Board IT Risk Committee within 30 days of each assessment. Critical and High vulnerabilities must be remediated within 30 and 60 days respectively.

§ 6.1 — Incident Response Centre
Banks shall establish a Security Operations Centre (SOC) with 24x7 operations, integrated with a Security Information and Event Management (SIEM) system, capable of real-time threat detection, correlation, and incident response. The SOC shall have documented escalation procedures with a maximum 15-minute response time for Category A alerts. The SOC may be established in-house or outsourced to a CERT-In empanelled Managed Security Service Provider (MSSP).

§ 7.2 — Business Continuity Planning
Banks shall update their Business Continuity Plans (BCP) and Disaster Recovery Plans (DRP) to explicitly include cybersecurity incident scenarios, including ransomware, DDoS, and supply chain attacks. Recovery objectives shall specify a Recovery Point Objective (RPO) of not more than 4 hours and Recovery Time Objective (RTO) of not more than 24 hours for critical systems. Full-scale simulation exercises shall be conducted annually.

§ 8.1 — Audit Trails & Logging
Banks shall maintain complete, immutable, and tamper-evident audit trails for all privileged user access, administrative actions, and critical system transactions for a minimum period of 7 years from the date of the transaction. Logs shall be stored in Write Once Read Many (WORM) compliant storage with quarterly hash verification to ensure integrity. Log access shall itself be logged and monitored.

Yours faithfully,
Deputy Governor, Reserve Bank of India`,
  },
  {
    id: 'c2b3c4d5-f6a7-8901-bcde-f01234567891',
    title: 'SEBI Cybersecurity & Cyber Resilience Framework 2024',
    source: 'SEBI',
    created_at: '2026-06-20T14:30:00',
    maps_count: 4,
    content: `SEBI/HO/CSCRF/2024/CIR/P/67
June 20, 2024

CIRCULAR
To,
All SEBI Registered Entities
Recognised Stock Exchanges, Clearing Corporations, Depositories
Asset Management Companies, Brokers, and Market Infrastructure Institutions

Dear Sir/Madam,

Cybersecurity and Cyber Resilience Framework (CSCRF) 2024 — Updated Guidelines

In exercise of powers under Section 11(1) of the Securities and Exchange Board of India Act, 1992, SEBI hereby issues the following updated Cybersecurity and Cyber Resilience Framework applicable to all SEBI-registered entities.

§ 3.1 — Governance Framework
Every SEBI-regulated entity shall designate a Chief Information Security Officer (CISO) who shall report directly to the Board of Directors. The CISO shall have a minimum of 10 years of professional experience in information security and shall have independent budget authority for cybersecurity investments. This appointment shall be made within 60 days of the issuance of this circular. The CISO shall present a quarterly cybersecurity status report to the Board.

§ 4.3 — Network Security Architecture
Banks and regulated entities shall implement Zero Trust Network Architecture (ZTNA) principles, including micro-segmentation of critical financial infrastructure, to prevent lateral movement by attackers. Critical infrastructure shall be defined as Core Banking Systems, Payment Gateways, Treasury Management Systems, and SWIFT Infrastructure. Implementation shall be phased over three financial years with Phase 1 (Treasury and Payment systems) commencing within 6 months.

§ 5.1 — Cyber Hygiene & Awareness
All employees of SEBI-regulated entities shall undergo mandatory cybersecurity awareness training on an annual basis. Training programmes shall be role-based, covering separate tracks for IT/technical staff, management, operations, and customer-facing staff. A minimum assessment score of 80% shall be required to pass. Training completion and assessment scores shall be documented and available for regulatory inspection on request.

§ 9.2 — Regulatory Reporting
All entities regulated by SEBI shall submit cyber incident reports to SEBI within 6 hours of detection for Category A incidents (those affecting market operations, customer data, or involving critical infrastructure). Reports shall use the prescribed SEBI Cyber Incident Reporting Template v3.2. Incidents with potential systemic impact shall simultaneously be reported to RBI and CERT-In. A final Root Cause Analysis report shall be submitted within 30 days.

Yours faithfully,
Whole Time Member, Securities and Exchange Board of India`,
  },
]

export const MOCK_MAPS = [
  // ── RBI Cybersecurity Framework MAPs ───────────────────────────────────────
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234560001',
    circular_id: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890',
    action: 'Implement multi-factor authentication for all privileged user accounts accessing core banking systems within 90 days',
    department: 'IT',
    priority: 'Critical',
    status: 'Pending',
    deadline: '2026-09-20',
    confidence_score: 0.96,
    source_clause: '§ 4.2.1 — Authentication Controls',
    validation_notes: 'Non-compliance risk to upcoming RBI inspection Q3 2026. MFA must cover CBS, Treasury, and SWIFT gateways.',
    created_at: '2026-06-21T10:02:15',
    clause_text: 'Banks shall implement multi-factor authentication (MFA) for all privileged users accessing Core Banking Solutions (CBS), Internet Banking, Treasury Systems, SWIFT Gateway, and any critical payment infrastructure. This requirement shall be complied with within 90 days of issuance of this circular. MFA solutions must use TOTP, hardware tokens, or biometric verification. OTP via SMS is not acceptable for privileged access.',
    reasoning: 'This clause imposes a mandatory, time-bound security control using "shall" — a non-negotiable obligation. MFA for privileged access is explicitly required across named systems (CBS, SWIFT, Treasury). The 90-day deadline and specific exclusion of SMS OTP create a precise, auditable requirement that RBI examiners will verify directly.',
    dept_reason: 'Assigned to IT because implementation requires configuration of Identity & Access Management (IAM) systems, Active Directory Group Policy, RADIUS server setup, and authentication infrastructure across CBS, Treasury, and SWIFT. This is a technical deployment task requiring infrastructure team ownership.',
    priority_reason: 'Critical because: (1) three specific named systems are enumerated in the clause, (2) an explicit 90-day deadline is stated, (3) RBI IT inspections include a direct MFA compliance check, and (4) unprotected privileged access to CBS and SWIFT represents an active, exploitable vulnerability.',
    evidence_docs: [
      { type: 'policy',      name: 'Multi-Factor Authentication Policy v2.0' },
      { type: 'screenshot',  name: 'IAM System — MFA Enforcement Configuration Screenshots' },
      { type: 'report',      name: 'Privileged Access Audit Report Q3 2026' },
      { type: 'certificate', name: 'CERT-In MFA Compliance Attestation Letter' },
      { type: 'log',         name: 'Privileged Session Logs — 30-day Sample Export' },
    ],
    risk: {
      operational: 'Credential theft targeting privileged accounts enables unauthorized access to CBS and SWIFT, allowing fraudulent transaction creation, account manipulation, and payment system abuse.',
      regulatory:  'Explicit RBI mandate with audit verification. Non-compliance results in adverse IT examination finding requiring Board-level response within 21 days.',
      business:    'Successful privileged account compromise could trigger SWIFT fraud, customer data exfiltration, regulatory sanctions, and potential license proceedings.',
      inspection:  'RBI IT examiners will directly test for MFA on CBS and SWIFT during Q3 2026 inspection. Absence = automatic Critical Observation.',
      score: 92,
      level: 'Critical',
    },
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234560002',
    circular_id: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890',
    action: 'Conduct quarterly vulnerability assessments and penetration testing of all internet-facing banking applications by CERT-In empanelled vendors',
    department: 'IT',
    priority: 'High',
    status: 'Approved',
    deadline: '2026-07-31',
    confidence_score: 0.91,
    source_clause: '§ 5.3.2 — Vulnerability Management',
    validation_notes: 'Penetration testing vendor must be CERT-In empanelled. Results to be placed before Board IT Committee.',
    created_at: '2026-06-21T10:02:30',
    clause_text: 'Banks shall conduct comprehensive vulnerability assessments and penetration testing of all internet-facing applications, mobile banking platforms, and API gateways on a quarterly basis. All testing shall be performed by vendors empanelled with CERT-In. Test results and remediation plans shall be placed before the Board IT Risk Committee within 30 days of each assessment.',
    reasoning: 'Mandatory quarterly testing with an explicit CERT-In vendor qualification requirement. The Board IT Risk Committee reporting creates a governance checkpoint that must be evidenced. Two distinct deliverables are required: the test report AND a remediation plan, both within 30 days.',
    dept_reason: 'IT owns this because VAPT scope definition, vendor coordination, remediation tracking, and infrastructure access for testing are all IT functions. The Board presentation is prepared by IT leadership.',
    priority_reason: 'High because the first quarterly assessment is due within 40 days. CERT-In vendor empanelment verification takes 2-4 weeks, creating an immediate procurement lead time. The 30-day Board reporting deadline runs from the assessment date.',
    evidence_docs: [
      { type: 'report',   name: 'Quarterly VAPT Report — Q3 2026 (CERT-In Vendor)' },
      { type: 'policy',   name: 'Penetration Testing Scope and Methodology Document' },
      { type: 'minutes',  name: 'Board IT Risk Committee Meeting Minutes — VAPT Findings' },
      { type: 'contract', name: 'CERT-In Empanelled Vendor Contract with Scope of Work' },
    ],
    risk: {
      operational: 'Undetected vulnerabilities in internet banking, mobile apps, and APIs create active attack surfaces for SQL injection, credential stuffing, and API abuse.',
      regulatory:  'Failure to conduct quarterly VAPT or use non-empanelled vendors constitutes direct non-compliance. Board presentation evidence required for inspection.',
      business:    'Known but unpatched vulnerabilities exploited by attackers trigger customer loss notifications, regulatory investigation, and mandatory compensation.',
      inspection:  'RBI examiners request last 4 quarters of VAPT reports, vendor empanelment certificates, and Board presentation evidence.',
      score: 72,
      level: 'High',
    },
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234560003',
    circular_id: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890',
    action: 'Establish a 24x7 Security Operations Centre (SOC) with SIEM integration for real-time cyber threat monitoring and response',
    department: 'IT',
    priority: 'Critical',
    status: 'Pending',
    deadline: '2026-12-31',
    confidence_score: 0.88,
    source_clause: '§ 6.1 — Incident Response Centre',
    validation_notes: 'Can be outsourced to CERT-In empanelled MSSP. SLA must mandate 15-minute alert response time.',
    created_at: '2026-06-21T10:02:45',
    clause_text: 'Banks shall establish a Security Operations Centre (SOC) with 24x7 operations, integrated with a Security Information and Event Management (SIEM) system, capable of real-time threat detection, correlation, and incident response. The SOC shall have documented escalation procedures with a maximum 15-minute response time for Category A alerts.',
    reasoning: 'SOC establishment is a structural security governance requirement. The 24x7 coverage, 15-minute Category A SLA, and SIEM integration are all specific, measurable requirements. This is a foundational control on which detection of all other incidents depends.',
    dept_reason: 'IT is responsible for SOC architecture and SIEM integration regardless of in-house vs. MSSP model. IT defines alert categories, maintains SIEM rules, and owns the escalation runbooks.',
    priority_reason: 'Critical because the SOC is a prerequisite for detecting violations of every other security control in this circular. Without it, the bank cannot demonstrate real-time threat response capability to RBI.',
    evidence_docs: [
      { type: 'policy',   name: 'SOC Operations Manual and Escalation Runbooks v1.0' },
      { type: 'report',   name: 'SIEM Architecture and Integration Design Document' },
      { type: 'contract', name: 'MSSP SLA Agreement — 24x7 Coverage and 15-min Response' },
      { type: 'report',   name: 'SOC Alert Dashboard Screenshots — Live Feed' },
      { type: 'report',   name: 'Incident Response Drill After-Action Report' },
    ],
    risk: {
      operational: 'Without a SOC, cyber intrusions go undetected for weeks or months, allowing attackers to establish persistent access, exfiltrate data, and conduct fraudulent transactions.',
      regulatory:  'SOC is explicitly mandated. Absence represents a Category A gap in the cybersecurity posture with automatic adverse finding.',
      business:    'Delayed incident detection increases breach scope and remediation cost by orders of magnitude compared to early SOC-based detection.',
      inspection:  'RBI will verify SOC existence, SIEM integration logs, and test escalation procedures with a scenario drill during onsite inspection.',
      score: 88,
      level: 'Critical',
    },
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234560004',
    circular_id: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890',
    action: 'Update Business Continuity Plan to include cybersecurity incident scenarios with RPO of 4 hours and RTO of 24 hours',
    department: 'Risk',
    priority: 'High',
    status: 'In Progress',
    deadline: '2026-08-15',
    confidence_score: 0.83,
    source_clause: '§ 7.2 — Business Continuity Planning',
    validation_notes: 'BCP must be tested with a full simulation exercise annually. Risk committee sign-off required.',
    created_at: '2026-06-21T10:03:00',
    clause_text: 'Banks shall update their Business Continuity Plans (BCP) and Disaster Recovery Plans (DRP) to explicitly include cybersecurity incident scenarios, including ransomware, DDoS, and supply chain attacks. Recovery objectives shall specify a Recovery Point Objective (RPO) of not more than 4 hours and Recovery Time Objective (RTO) of not more than 24 hours for critical systems.',
    reasoning: 'Requires specific quantitative updates to existing BCP/DRP documents with defined RPO/RTO targets. Three attack scenarios are explicitly named (ransomware, DDoS, supply chain), which narrows scope. Annual simulation testing creates an ongoing evidence obligation.',
    dept_reason: 'Risk department owns the BCP/DRP framework as part of enterprise risk management. Risk coordinates with IT for technical recovery procedures and Compliance for regulatory reporting aspects of incidents.',
    priority_reason: 'High because BCP simulation exercises require months of multi-departmental coordination and rehearsal. With a deadline of August 15, planning must begin immediately to include the full simulation before the deadline.',
    evidence_docs: [
      { type: 'policy',  name: 'Business Continuity Plan v4.0 — Cyber Scenarios Addendum' },
      { type: 'report',  name: 'BCP Simulation Exercise Report — Ransomware Scenario' },
      { type: 'minutes', name: 'Risk Committee Sign-off on Updated BCP — Board Minutes' },
      { type: 'report',  name: 'RPO/RTO Achievement Evidence — Backup Recovery Test Results' },
    ],
    risk: {
      operational: 'Without cyber-scenario BCPs, the bank has no structured playbook for ransomware or DDoS, potentially causing extended CBS downtime affecting millions of customers.',
      regulatory:  'BCP with cyber scenarios is a direct regulatory requirement. Outdated BCPs without these scenarios result in inspection findings.',
      business:    'Extended CBS downtime causes direct revenue loss, customer churn, regulatory reporting obligations, and potential class-action liability.',
      inspection:  'Inspectors will request BCP documents and evidence of annual simulation exercises including cyber scenarios.',
      score: 67,
      level: 'High',
    },
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234560005',
    circular_id: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890',
    action: 'Implement Data Loss Prevention (DLP) controls across all endpoints to prevent exfiltration of customer PII and financial data',
    department: 'Compliance',
    priority: 'High',
    status: 'Pending',
    deadline: '2026-10-01',
    confidence_score: 0.79,
    source_clause: '§ 4.4 — Data Protection & Privacy',
    validation_notes: 'DLP policy must be reviewed by Legal before deployment. Cover email, USB, cloud uploads.',
    created_at: '2026-06-21T10:03:15',
    clause_text: 'Banks shall implement Data Loss Prevention (DLP) controls across all endpoints, email gateways, and cloud upload channels to prevent unauthorized exfiltration of customer Personally Identifiable Information (PII), account data, and transaction records. DLP policies shall be reviewed by the Legal and Compliance team before deployment and updated annually.',
    reasoning: 'DLP is required across three specific channels (endpoints, email, cloud). A Legal review prerequisite before deployment creates a two-step compliance workflow. Annual policy update obligation creates a recurring compliance calendar item.',
    dept_reason: 'Compliance owns this MAP because DLP scope is defined by data classification (a compliance function), Legal review is required, and data exfiltration incidents trigger mandatory regulatory reporting that Compliance manages.',
    priority_reason: 'High because data exfiltration is the most consequential regulatory event type, triggering mandatory RBI notification within 6 hours and potential DPDP Act enforcement. DLP implementation also has a long vendor procurement and testing cycle.',
    evidence_docs: [
      { type: 'policy',   name: 'Data Loss Prevention Policy v1.0' },
      { type: 'report',   name: 'DLP Coverage Report — Endpoints, Email, Cloud Channels' },
      { type: 'approval', name: 'Legal Team Sign-off on DLP Policy — Dated Approval' },
      { type: 'report',   name: 'DLP Alert Monitoring Dashboard — 30-day Incident Report' },
    ],
    risk: {
      operational: 'Without DLP, malicious insiders or compromised accounts can silently exfiltrate customer PII via email, USB, or cloud services.',
      regulatory:  'PII breach triggers mandatory RBI notification (within 6 hours), DPDP Act 2023 breach notification, and potential SEBI enforcement for listed entities.',
      business:    'PII breach causes regulatory penalties, class-action liability, CERT-In notification requirements, and permanent reputational damage.',
      inspection:  'Inspectors will verify DLP coverage across all three channels and request Legal review documentation.',
      score: 68,
      level: 'High',
    },
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234560006',
    circular_id: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890',
    action: 'Maintain immutable audit trails with tamper-evident logs for all privileged access for a minimum of 7 years from transaction date',
    department: 'Compliance',
    priority: 'Medium',
    status: 'Completed',
    deadline: null,
    confidence_score: 0.93,
    source_clause: '§ 8.1 — Audit Trails & Logging',
    validation_notes: 'Logs must be stored in WORM-compliant storage. Hash verification required quarterly.',
    created_at: '2026-06-21T10:03:30',
    clause_text: 'Banks shall maintain complete, immutable, and tamper-evident audit trails for all privileged user access, administrative actions, and critical system transactions for a minimum period of 7 years from the date of the transaction. Logs shall be stored in Write Once Read Many (WORM) compliant storage with quarterly hash verification to ensure integrity.',
    reasoning: 'Record retention mandate with specific technical requirements: WORM storage and quarterly hash verification. The 7-year period is longer than standard banking records requirements, reflecting regulatory emphasis on long-term forensic capability. This MAP is Completed.',
    dept_reason: 'Compliance owns audit trail requirements as they support regulatory reporting, forensic investigations, and inspection evidence. Compliance coordinates with IT for WORM storage implementation and hash verification scheduling.',
    priority_reason: 'Medium because this MAP is already Completed — the bank has implemented the baseline controls. Ongoing compliance requires quarterly hash verification monitoring and periodic WORM storage certification.',
    evidence_docs: [
      { type: 'certificate', name: 'WORM Storage Implementation and Vendor Certificate' },
      { type: 'report',      name: 'Quarterly Hash Verification Report Q2 2026' },
      { type: 'policy',      name: 'Audit Trail Retention Policy v3.0 — 7-Year Schedule' },
      { type: 'certificate', name: 'Log Integrity Attestation — Internal Audit Sign-off' },
    ],
    risk: {
      operational: 'Tampered or incomplete audit logs prevent forensic investigation of security incidents, undermining root cause analysis and regulatory reporting.',
      regulatory:  'Inability to produce 7-year audit trails during inspection is a serious regulatory finding. WORM certification is a specific technical requirement.',
      business:    'Without audit trails, the bank cannot defend itself in disputes, litigation, or regulatory investigations.',
      inspection:  'Inspectors request a sample log export and WORM certification. Hash verification records must be available for the last 4 quarters.',
      score: 32,
      level: 'Low',
    },
  },

  // ── SEBI CSCRF MAPs ───────────────────────────────────────────────────────
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234560007',
    circular_id: 'c2b3c4d5-f6a7-8901-bcde-f01234567891',
    action: 'Appoint a Chief Information Security Officer (CISO) reporting directly to the Board with independent budget authority',
    department: 'Compliance',
    priority: 'Critical',
    status: 'Pending',
    deadline: '2026-07-01',
    confidence_score: 0.97,
    source_clause: '§ 3.1 — Governance Framework',
    validation_notes: 'CISO must have minimum 10 years cybersecurity experience. Board approval required.',
    created_at: '2026-06-20T14:45:00',
    clause_text: 'Every SEBI-regulated entity shall designate a Chief Information Security Officer (CISO) who shall report directly to the Board of Directors. The CISO shall have a minimum of 10 years of professional experience in information security and shall have independent budget authority for cybersecurity investments. This appointment shall be made within 60 days of the issuance of this circular.',
    reasoning: 'Board-level governance mandate with a strict 60-day deadline (deadline: July 1, 2026 — imminent). CISO appointment requires Board resolution and regulatory disclosure to SEBI. The independent budget authority requirement is a specific governance control that must be documented in the CISO charter.',
    dept_reason: 'Compliance owns SEBI-mandated governance appointments because they require Board resolution drafting, regulatory disclosure filings with SEBI, and ongoing compliance monitoring of the role against the framework requirements.',
    priority_reason: 'Critical because: (1) the 60-day deadline is 11 days away, (2) Board resolution is required — a process that takes multiple board meeting cycles to schedule, (3) SEBI verifies this through mandatory regulatory disclosures, and (4) failure to appoint has direct regulatory consequences.',
    evidence_docs: [
      { type: 'minutes',    name: 'Board Resolution — CISO Appointment (Extraordinary Meeting)' },
      { type: 'disclosure', name: 'SEBI Regulatory Disclosure — CISO Name and Credentials' },
      { type: 'policy',     name: 'CISO Charter — Board Reporting Line and Budget Authority' },
      { type: 'report',     name: 'CISO Qualifications Certificate — 10-Year Experience Verification' },
    ],
    risk: {
      operational: 'Without a Board-reporting CISO, cybersecurity investments compete with business P&L priorities and are systematically under-resourced.',
      regulatory:  'SEBI has explicit statutory authority to penalize non-compliant entities and require appointment. Missing the 60-day deadline triggers automatic regulatory inquiry.',
      business:    'Institutional investors and credit rating agencies now evaluate cybersecurity governance. Absence of a CISO affects credit ratings and ESG scores.',
      inspection:  'SEBI inspectors verify CISO appointment, Board reporting line, and budget authority. Missing CISO = automatic adverse regulatory observation.',
      score: 95,
      level: 'Critical',
    },
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234560008',
    circular_id: 'c2b3c4d5-f6a7-8901-bcde-f01234567891',
    action: 'Submit quarterly cyber incident reports to SEBI in prescribed format within 6 hours of detection for Category A incidents',
    department: 'Legal',
    priority: 'High',
    status: 'Approved',
    deadline: '2026-07-15',
    confidence_score: 0.85,
    source_clause: '§ 9.2 — Regulatory Reporting',
    validation_notes: 'SEBI reporting template v3.2 must be used. CC to RBI for incidents above threshold.',
    created_at: '2026-06-20T14:45:30',
    clause_text: 'All entities regulated by SEBI shall submit cyber incident reports to SEBI within 6 hours of detection for Category A incidents (those affecting market operations or involving customer data). Reports shall use the prescribed SEBI Cyber Incident Reporting Template v3.2. Incidents with potential systemic impact shall simultaneously be reported to RBI.',
    reasoning: 'Time-critical reporting mandate (6-hour window) requiring a specific pre-approved template (v3.2) and dual reporting to RBI for systemic incidents. Pre-built templates and escalation procedures must exist before any incident occurs — compliance cannot be achieved reactively.',
    dept_reason: 'Legal owns regulatory incident reporting because these are legal filings with regulatory consequences. Legal coordinates with IT (for incident facts) and Compliance (for regulatory classification) but controls the submission.',
    priority_reason: 'High because the 6-hour reporting window is operationally very tight. Without pre-built templates, contact lists, and escalation procedures already in place, timely compliance during an active incident is virtually impossible.',
    evidence_docs: [
      { type: 'template', name: 'SEBI Cyber Incident Report — Pre-filled Template v3.2' },
      { type: 'policy',   name: 'Incident Reporting Runbook — Legal Escalation Procedure' },
      { type: 'report',   name: 'SEBI / RBI / CERT-In Contact Directory — Updated 2026' },
      { type: 'report',   name: 'Dry-Run Incident Report — Legal Team Tabletop Exercise' },
    ],
    risk: {
      operational: 'Without pre-built templates and procedures, the 6-hour filing deadline is impossible to meet during a live incident with active investigation ongoing.',
      regulatory:  'Late or inaccurate SEBI incident reports trigger penalty proceedings, enhanced supervisory scrutiny, and potential trading restrictions.',
      business:    'Regulatory penalties, investor notification requirements, and reputation damage following failed incident reporting.',
      inspection:  'SEBI reviews incident history and verifies that all Category A incidents had compliant 6-hour reporting with the correct template version.',
      score: 74,
      level: 'High',
    },
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234560009',
    circular_id: 'c2b3c4d5-f6a7-8901-bcde-f01234567891',
    action: 'Conduct mandatory cybersecurity awareness training for all employees annually with minimum 80% assessment score to pass',
    department: 'Risk',
    priority: 'Medium',
    status: 'In Progress',
    deadline: '2026-09-30',
    confidence_score: 0.78,
    source_clause: '§ 5.1 — Cyber Hygiene & Awareness',
    validation_notes: 'Training must be role-based: separate tracks for IT, management, operations, and frontline staff.',
    created_at: '2026-06-20T14:46:00',
    clause_text: 'All employees of SEBI-regulated entities shall undergo mandatory cybersecurity awareness training on an annual basis. Training programmes shall be role-based, covering separate tracks for IT/technical staff, management, operations, and customer-facing staff. A minimum assessment score of 80% shall be required to pass. Training completion shall be documented and available for inspection.',
    reasoning: 'Annual mandatory training with measurable pass threshold (80%) and role-based curriculum design. Documentation for inspection creates a compliance record obligation spanning the full employee population — hundreds to thousands of records.',
    dept_reason: 'Risk department owns the training framework as part of enterprise risk culture. Risk coordinates with HR for employee completion tracking, IT for technical track curriculum, and Compliance for regulatory documentation.',
    priority_reason: 'Medium because the September 30 deadline allows 90-day planning time. However, training content development, LMS configuration, and role-based track design have significant lead time.',
    evidence_docs: [
      { type: 'policy',      name: 'Annual Cybersecurity Training Programme Design Document' },
      { type: 'report',      name: 'Training Completion Report — Employee Assessment Scores by Role' },
      { type: 'report',      name: 'Role-based Training Tracks — IT / Management / Operations / Frontline' },
      { type: 'certificate', name: 'LMS Platform Audit Export — Completion and Pass Rate Records' },
    ],
    risk: {
      operational: 'Untrained employees are the primary attack vector for phishing, social engineering, and credential theft — the leading cause of banking cyber incidents globally.',
      regulatory:  'Training documentation with pass rates is a standard inspection item. <80% pass rates or missing records result in regulatory findings.',
      business:    'Phishing-induced incidents cause financial losses, regulatory notifications, and reputational damage that dwarfs training investment costs.',
      inspection:  'Inspectors request training completion rates, role-based curriculum documentation, and assessment score distributions.',
      score: 42,
      level: 'Medium',
    },
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234560010',
    circular_id: 'c2b3c4d5-f6a7-8901-bcde-f01234567891',
    action: 'Implement zero-trust network architecture with micro-segmentation for all critical financial infrastructure by end of FY27',
    department: 'Treasury',
    priority: 'Medium',
    status: 'Pending',
    deadline: '2026-12-31',
    confidence_score: 0.72,
    source_clause: '§ 4.3 — Network Security Architecture',
    validation_notes: 'Phase rollout over 3 quarters. Treasury systems in Phase 1, CBS in Phase 2.',
    created_at: '2026-06-20T14:46:30',
    clause_text: 'Banks and regulated entities shall implement Zero Trust Network Architecture (ZTNA) principles, including micro-segmentation of critical financial infrastructure, to prevent lateral movement by attackers. Critical infrastructure shall be defined as Core Banking Systems, Payment Gateways, Treasury Management Systems, and SWIFT Infrastructure. Implementation shall be phased over three financial years.',
    reasoning: 'Long-horizon architectural requirement with a 3-year phase timeline. Four specific systems are named as critical infrastructure scope. Treasury systems are Phase 1, requiring immediate planning to begin despite the extended overall timeline.',
    dept_reason: 'Treasury is assigned because Treasury Management Systems are Phase 1 priority (highest financial exposure), and Treasury IT architects understand the segmentation requirements for trading, settlement, and SWIFT connectivity.',
    priority_reason: 'Medium due to 3-year phased timeline but with Phase 1 beginning within 6 months. The planning and architecture design work must start now to maintain Phase 1 schedule.',
    evidence_docs: [
      { type: 'report',  name: 'Zero Trust Architecture Design Document — Phase 1 Treasury Systems' },
      { type: 'report',  name: 'Micro-segmentation Implementation Roadmap — 3-Year Plan' },
      { type: 'minutes', name: 'Technology Architecture Board Approval — ZTNA Decision' },
      { type: 'report',  name: 'Network Topology Diagrams — Current vs Target State' },
    ],
    risk: {
      operational: 'Flat network architecture allows lateral movement from any compromised system to CBS, SWIFT, and payment gateways — dramatically amplifying any breach.',
      regulatory:  'ZTNA is a mandatory 3-year journey. Failure to begin Phase 1 on schedule will be visible at the next inspection cycle.',
      business:    'Lateral movement attacks are the primary enabler of large-scale banking fraud. Full segmentation dramatically limits breach impact.',
      inspection:  'Inspectors will verify Phase 1 completion in FY27 annual examination. Architecture diagrams and implementation evidence required.',
      score: 45,
      level: 'Medium',
    },
  },
]

export const MOCK_EVENTS = [
  { id: 'e10', event_type: 'MAP_APPROVED',       description: 'Compliance approved: Submit quarterly cyber incident reports to SEBI', actor: 'Compliance Officer',           created_at: '2026-06-21T10:29:00' },
  { id: 'e9',  event_type: 'MAP_STATUS_CHANGED', description: 'Risk moved BCP update MAP to In Progress',                            actor: 'Risk Manager',                created_at: '2026-06-21T10:24:00' },
  { id: 'e8',  event_type: 'MAP_APPROVED',       description: 'IT approved: Quarterly vulnerability assessments and penetration testing', actor: 'Compliance Officer',       created_at: '2026-06-21T10:18:00' },
  { id: 'e7',  event_type: 'MAP_STATUS_CHANGED', description: 'Compliance marked audit-trails MAP as Completed',                     actor: 'Compliance Administrator',    created_at: '2026-06-21T10:12:00' },
  { id: 'e6',  event_type: 'MAPS_EXTRACTED',     description: 'PRAGMA AI extracted 6 MAPs from RBI Cybersecurity Framework 2026',    actor: 'PRAGMA AI Engine', created_at: '2026-06-21T10:02:00' },
  { id: 'e5',  event_type: 'CIRCULAR_UPLOADED',  description: 'RBI Cybersecurity Framework for Banks 2026 uploaded for processing',  actor: 'Compliance Administrator',    created_at: '2026-06-21T09:55:00' },
  { id: 'e4',  event_type: 'MAP_APPROVED',       description: 'Legal approved: Quarterly cyber incident reporting to SEBI',          actor: 'Legal Officer',               created_at: '2026-06-20T16:30:00' },
  { id: 'e3',  event_type: 'MAP_STATUS_CHANGED', description: 'Risk moved cybersecurity training MAP to In Progress',                actor: 'Risk Manager',                created_at: '2026-06-20T15:20:00' },
  { id: 'e2',  event_type: 'MAPS_EXTRACTED',     description: 'PRAGMA AI extracted 4 MAPs from SEBI CSCRF 2024',                    actor: 'PRAGMA AI Engine', created_at: '2026-06-20T14:45:00' },
  { id: 'e1',  event_type: 'CIRCULAR_UPLOADED',  description: 'SEBI Cybersecurity and Cyber Resilience Framework uploaded',         actor: 'Compliance Administrator',    created_at: '2026-06-20T14:30:00' },
]
