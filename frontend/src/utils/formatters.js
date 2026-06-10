/**
 * PRAGMA — Display Formatters
 *
 * Owner: Ashwin (React Dashboard)
 * Pure functions — no side effects, easy to unit test.
 */

export const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export const formatDateTime = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export const truncate = (text, max = 120) => {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export const pluralise = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : plural}`
