/**
 * PRAGMA — UI Constants
 *
 * Centralised labels and Tailwind class mappings used across components.
 * Owner: Ashwin (React Dashboard)
 * Update colours here — never scatter them across components.
 */

export const MAP_STATUSES = {
  PENDING:     'Pending',
  APPROVED:    'Approved',
  REJECTED:    'Rejected',
  IN_PROGRESS: 'In Progress',
  COMPLETED:   'Completed',
}

export const MAP_STATUS_COLORS = {
  'Pending':     'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'Approved':    'bg-blue-100   text-blue-800   border border-blue-200',
  'Rejected':    'bg-red-100    text-red-800    border border-red-200',
  'In Progress': 'bg-purple-100 text-purple-800 border border-purple-200',
  'Completed':   'bg-green-100  text-green-800  border border-green-200',
}

export const MAP_PRIORITY_COLORS = {
  'Critical': 'bg-red-100    text-red-800    border border-red-200',
  'High':     'bg-orange-100 text-orange-800 border border-orange-200',
  'Medium':   'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'Low':      'bg-gray-100   text-gray-700   border border-gray-200',
}

export const DEPARTMENTS = ['IT', 'Compliance', 'Risk', 'Treasury', 'Legal']

export const CIRCULAR_SOURCES = ['RBI', 'SEBI', 'MCA']

// How often the dashboard polls for updated MAP/event data (ms)
export const POLL_INTERVAL_MS = 5000
