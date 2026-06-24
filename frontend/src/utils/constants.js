/**
 * PRAGMA — UI Constants
 * Owner: Ashwin — M3 / M4 premium pass
 * Centralised labels and Tailwind class mappings. Update colours here only.
 */

export const MAP_STATUSES = {
  PENDING:     'Pending',
  APPROVED:    'Approved',
  REJECTED:    'Rejected',
  IN_PROGRESS: 'In Progress',
  COMPLETED:   'Completed',
}

// Flat, hairline-bordered, restrained — reads as a status field, not a sticker
// All variants include dark mode counterparts to prevent white-on-dark artefacts
export const MAP_STATUS_COLORS = {
  'Pending':     'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60',
  'Approved':    'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60',
  'Rejected':    'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60',
  'In Progress': 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800/60',
  'Completed':   'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60',
}

export const MAP_PRIORITY_COLORS = {
  'Critical': 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60',
  'High':     'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60',
  'Medium':   'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60',
  'Low':      'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60',
}

export const DEPARTMENTS = ['IT', 'Compliance', 'Risk', 'Treasury', 'Legal']

export const CIRCULAR_SOURCES = ['RBI', 'SEBI', 'MCA']

export const POLL_INTERVAL_MS = 5000
