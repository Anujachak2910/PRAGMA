// PRAGMA — Mock data for frontend dev. Shape matches the live GET /maps contract.
// Used automatically by useMaps() only when the backend is unreachable.
export const MOCK_MAPS = [
  { id: 1, action: 'Update KYC verification to include Video-CIP for all digital lending customers', department: 'Compliance', priority: 'Critical', status: 'Pending', deadline: '2026-09-15' },
  { id: 2, action: 'Implement real-time disbursement controls to verified borrower accounts only', department: 'IT', priority: 'High', status: 'In Progress', deadline: '2026-08-30' },
  { id: 3, action: 'Perform quarterly operational risk assessment on the digital lending workflow', department: 'Risk', priority: 'Medium', status: 'Completed', deadline: null },
  { id: 4, action: 'Provide Key Fact Statement disclosing APR and cooling-off period before sanction', department: 'Legal', priority: 'High', status: 'Approved', deadline: '2026-07-20' },
  { id: 5, action: 'Retain KYC video evidence for a minimum of 10 years from loan closure', department: 'Compliance', priority: 'Medium', status: 'Pending', deadline: null },
]

export const MOCK_EVENTS = [
  { id: 5, event_type: 'MAP_APPROVED',      description: 'Compliance approved: Provide Key Fact Statement disclosing APR', timestamp: '2026-06-11T10:18:00' },
  { id: 4, event_type: 'MAP_STATUS_CHANGED',description: 'IT moved disbursement-controls MAP to In Progress',             timestamp: '2026-06-11T10:12:00' },
  { id: 3, event_type: 'MAPS_EXTRACTED',    description: 'Claude extracted 5 MAPs from the circular',                     timestamp: '2026-06-11T10:01:30' },
  { id: 2, event_type: 'CIRCULAR_UPLOADED', description: 'RBI Digital Lending Guidelines 2024 uploaded',                  timestamp: '2026-06-11T10:00:00' },
  { id: 1, event_type: 'DEMO_RESET',        description: 'Demo environment reset',                                       timestamp: '2026-06-11T09:55:00' },
]
