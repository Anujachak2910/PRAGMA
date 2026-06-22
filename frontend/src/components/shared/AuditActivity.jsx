import React from 'react'
import { useEvents } from '../../hooks/useEvents'
import { formatDateTime } from '../../utils/formatters'

const EVENT_STYLE = (t = '') => {
  const u = t.toUpperCase()
  if (u.includes('APPROV'))  return { dot: 'bg-ink',        badge: 'bg-primary-50  text-primary-700 border-primary-200' }
  if (u.includes('REJECT'))  return { dot: 'bg-danger',     badge: 'bg-danger-50   text-danger-700  border-danger-200'  }
  if (u.includes('COMPLET')) return { dot: 'bg-success',    badge: 'bg-success-50  text-success-700 border-success-200' }
  if (u.includes('EXTRACT')) return { dot: 'bg-violet-500', badge: 'bg-violet-50   text-violet-700  border-violet-200'  }
  if (u.includes('UPLOAD'))  return { dot: 'bg-brass',      badge: 'bg-brass-soft  text-brass-deep  border-brass/30'    }
  return                             { dot: 'bg-gray-400',   badge: 'bg-gray-50     text-gray-600    border-gray-200'    }
}

const fmtLabel = (t = '') =>
  t.toString().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

// Phase 1 performance: accepts events as prop when called from Dashboard
// (avoids a second useEvents() polling interval on the same page).
// Falls back to internal useEvents() when used standalone.
function AuditActivity({ events: propEvents }) {
  const { events: hookEvents } = useEvents()
  const events = propEvents ?? hookEvents
  const recent = events.slice(0, 6)

  return (
    <section className="rounded-xl border border-line bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass-deep">
          Recent Audit Activity
        </p>
        <span className="font-mono text-[10px] text-gray-400">
          {events.length} total event{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-line bg-paper">
            <span className="font-mono text-[16px] text-gray-300">○</span>
          </div>
          <p className="text-sm text-gray-500">No audit events yet.</p>
          <p className="font-mono text-[10px] text-gray-400">
            Events appear after circulars are uploaded.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {recent.map((e) => {
            const style = EVENT_STYLE(e.event_type)
            return (
              <li key={e.id} className="flex items-start gap-3">
                <span className={`mt-2 h-2 w-2 flex-shrink-0 rounded-full ${style.dot}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-block rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide ${style.badge}`}
                    >
                      {fmtLabel(e.event_type)}
                    </span>
                    <time className="flex-shrink-0 font-mono text-[10px] tabular-nums text-gray-400">
                      {formatDateTime(e.created_at)}
                    </time>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-gray-500">{e.description}</p>
                  {e.actor && (
                    <p className="font-mono text-[10px] text-gray-400">
                      — {e.actor}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default React.memo(AuditActivity)
