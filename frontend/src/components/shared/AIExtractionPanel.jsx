import React, { useMemo } from 'react'
import { useEvents } from '../../hooks/useEvents'
import { Sparkles } from 'lucide-react'

const prio = (p) => (p || '').toString().trim().toLowerCase()
const DEPTS = ['IT', 'Compliance', 'Risk', 'Treasury', 'Legal']
const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low']
const PRIORITY_FILL = { Critical: '#B42318', High: '#B54708', Medium: '#B08D57', Low: '#9CA3AF' }

function AIExtractionPanel({ maps }) {
  const { events } = useEvents()

  const stats = useMemo(() => {
    const uploadEvts  = events.filter((e) => (e.event_type || '').toUpperCase().includes('UPLOAD'))
    const routed      = maps.filter((m) => DEPTS.includes(m.department)).length
    const routedPct   = maps.length === 0 ? 0 : Math.round((routed / maps.length) * 100)
    const scores      = maps.filter((m) => m.confidence_score != null).map((m) => m.confidence_score)
    const avgConf     = scores.length === 0 ? null
      : Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)
    const mix = PRIORITY_ORDER.map((p) => ({
      p,
      n: maps.filter((m) => prio(m.priority) === p.toLowerCase()).length,
    }))
    const maxMix = Math.max(1, ...mix.map((m) => m.n))
    return { circulars: uploadEvts.length, routedPct, avgConf, mix, maxMix }
  }, [maps, events])

  return (
    <section className="rounded-xl border border-line bg-white p-6">
      <div className="mb-5 flex items-center gap-2">
        <Sparkles size={13} className="text-violet-500" />
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass-deep">
          AI Extraction Engine
        </p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="font-serif text-3xl font-semibold tabular-nums text-ink">{maps.length}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">MAPs extracted</p>
        </div>
        <div>
          <p className="font-serif text-3xl font-semibold tabular-nums text-ink">
            {stats.circulars || '—'}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500">circulars processed</p>
        </div>
        <div>
          <p className="font-serif text-3xl font-semibold tabular-nums text-brass-deep">
            {stats.routedPct}%
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500">auto-routed</p>
        </div>
        <div>
          <p className={`font-serif text-3xl font-semibold tabular-nums ${
            stats.avgConf == null ? 'text-gray-400'
            : stats.avgConf >= 85 ? 'text-success-700'
            : 'text-warning-700'
          }`}>
            {stats.avgConf != null ? `${stats.avgConf}%` : '—'}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500">avg confidence</p>
        </div>
      </div>

      {/* AI model attribution */}
      <div className="mt-4 flex items-center gap-1.5 rounded border border-violet-200 bg-violet-50 px-2.5 py-1.5">
        <Sparkles size={11} className="text-violet-500 flex-shrink-0" />
        <span className="font-mono text-[10px] text-violet-700">
          Powered by Claude AI (claude-sonnet-4-6) · Anthropic
        </span>
      </div>

      {/* Priority mix */}
      <div className="mt-5 border-t border-line pt-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-gray-400">
          Priority distribution detected
        </p>
        <div className="space-y-1.5">
          {stats.mix.map((m) => (
            <div key={m.p} className="flex items-center gap-3">
              <span className="w-14 flex-shrink-0 text-[11px] text-gray-600">{m.p}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/50">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(m.n / stats.maxMix) * 100}%`,
                    background: PRIORITY_FILL[m.p],
                  }}
                />
              </div>
              <span className="w-5 flex-shrink-0 text-right font-mono text-[11px] tabular-nums text-gray-500">
                {m.n}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default React.memo(AIExtractionPanel)
