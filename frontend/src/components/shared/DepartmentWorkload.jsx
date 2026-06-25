import { Building2 } from 'lucide-react'

const key = (s) => (s || '').toString().trim().toUpperCase().replace(/\s+/g, '_')
const prio = (p) => (p || '').toString().trim().toLowerCase()
const RESOLVED = ['APPROVED', 'IN_PROGRESS', 'COMPLETED']
const PW = { critical: 4, high: 3, medium: 2, low: 1 }
const DEPTS = ['IT', 'Compliance', 'Risk', 'Treasury', 'Legal']

export default function DepartmentWorkload({ maps }) {
  const rows = DEPTS.map((d) => {
    const items    = maps.filter((m) => (m.department || '') === d)
    const open     = items.filter((m) => !RESOLVED.includes(key(m.status)))
    const load     = open.reduce((a, m) => a + (PW[prio(m.priority)] || 1), 0)
    const critical = open.filter((m) => prio(m.priority) === 'critical').length
    return { dept: d, total: items.length, open: open.length, load, critical }
  })
  const maxLoad = Math.max(1, ...rows.map((r) => r.load))

  return (
    <section className="rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-paper/40 dark:bg-surface/40 px-5 py-3">
        <Building2 size={13} className="text-[#8b98aa] flex-shrink-0" />
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass-deep dark:text-brass">
          Department Workload
        </p>
      </div>
      <div className="p-5 space-y-3">
        {rows.map((r) => (
          <div key={r.dept} className="flex items-center gap-4">
            <span className="w-24 flex-shrink-0 text-sm font-medium text-ink dark:text-[#e8edf5]">{r.dept}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-line dark:bg-surface">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(r.load / maxLoad) * 100}%`,
                  background: r.critical ? '#B42318' : '#2B4A8F',
                }}
              />
            </div>
            <span className="w-28 flex-shrink-0 text-right font-mono text-[11px] tabular-nums text-[#8b98aa]">
              {r.open} open / {r.total}
            </span>
            {r.critical > 0 && (
              <span className="flex-shrink-0 rounded border border-danger-200 dark:border-red-800/60 bg-danger-50 dark:bg-red-900/20 px-1.5 py-0.5 font-mono text-[10px] uppercase text-danger dark:text-red-400">
                {r.critical} crit
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
