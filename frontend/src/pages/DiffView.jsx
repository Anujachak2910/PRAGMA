/**
 * PRAGMA — Regulatory Change Diff Engine
 *
 * Select two circulars and instantly see what obligations changed:
 * new mandates added, removed mandates, modified deadlines/priorities,
 * and a net-impact summary.
 *
 * Entirely deterministic — works without Ollama.
 */

import { useState, useMemo } from 'react'
import api from '../services/api'
import { useCirculars } from '../hooks/useCirculars'
import { GitCompare, Plus, Minus, RefreshCw, AlertTriangle, CheckCircle2, ArrowRight, Calendar, Building2, Loader2, Info } from 'lucide-react'
import { formatDate } from '../utils/formatters'
import { SkeletonMetricCard } from '../components/shared/Skeleton'

// ── Priority badge colours ────────────────────────────────────────────────────
const PRIORITY_CLS = {
  Critical: 'border-red-300    dark:border-red-800   bg-red-50   dark:bg-red-900/30   text-red-700   dark:text-red-400',
  High:     'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  Medium:   'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  Low:      'border-gray-300   dark:border-gray-700   bg-gray-50  dark:bg-gray-800/40   text-gray-600  dark:text-gray-400',
}

const SEVERITY_CLS = {
  high:   { bar: 'bg-danger',  text: 'text-danger dark:text-red-400',  badge: 'bg-danger/10 dark:bg-red-900/30 text-danger dark:text-red-400 border-danger/20' },
  medium: { bar: 'bg-warning', text: 'text-warning dark:text-amber-400', badge: 'bg-warning/10 dark:bg-amber-900/30 text-warning dark:text-amber-400 border-warning/20' },
  low:    { bar: 'bg-success', text: 'text-success dark:text-green-400', badge: 'bg-success/10 dark:bg-green-900/20 text-success dark:text-green-400 border-success/20' },
}

function PriorityBadge({ priority }) {
  const cls = PRIORITY_CLS[priority] || PRIORITY_CLS.Low
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${cls}`}>
      {priority}
    </span>
  )
}

function MapCard({ map, variant }) {
  const cls = {
    added:    'border-l-4 border-l-success bg-success/5 dark:bg-green-900/10',
    removed:  'border-l-4 border-l-danger  bg-danger/5  dark:bg-red-900/10',
    old:      'border-l-4 border-l-warning bg-warning/5 dark:bg-amber-900/10',
    new:      'border-l-4 border-l-primary-500 bg-primary-50/50 dark:bg-primary-900/10',
    unchanged:'border-l-4 border-l-line   bg-paper      dark:bg-surface',
  }[variant] || ''

  return (
    <div className={`rounded-r-lg border border-line ${cls} px-4 py-3`}>
      <p className="text-[12.5px] font-medium leading-snug text-ink dark:text-[#e8edf5]">
        {map.action}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {map.department && (
          <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-[#8b98aa]">
            <Building2 size={9} />
            {map.department}
          </span>
        )}
        <PriorityBadge priority={map.priority} />
        {map.deadline && (
          <span className="flex items-center gap-1 font-mono text-[9px] text-[#8b98aa]">
            <Calendar size={9} />
            {formatDate(map.deadline)}
          </span>
        )}
        {map.source_clause && (
          <span className="font-mono text-[9px] text-brass">{map.source_clause}</span>
        )}
      </div>
    </div>
  )
}

function DiffSection({ title, icon: Icon, items, color, renderItem }) {
  if (!items || items.length === 0) return null
  return (
    <div className="rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-paper/40 dark:bg-surface/40 px-5 py-3">
        <Icon size={13} className={color} />
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass-deep dark:text-brass">
          {title}
        </p>
        <span className="ml-auto rounded-full bg-line dark:bg-surface/60 px-2 py-0.5 font-mono text-[9px] font-bold text-ink dark:text-[#e8edf5]">
          {items.length}
        </span>
      </div>
      <div className="divide-y divide-line/60">
        {items.map((item, i) => (
          <div key={i} className="p-4">
            {renderItem(item, i)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DiffView() {
  const { circulars, loading: circularsLoading } = useCirculars()
  const [circularA, setCircularA] = useState('')
  const [circularB, setCircularB] = useState('')
  const [result,    setResult]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  const canCompare = circularA && circularB && circularA !== circularB

  const runDiff = async () => {
    if (!canCompare) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await api.post('/insights/diff', {
        circular_a_id: circularA,
        circular_b_id: circularB,
      })
      setResult(data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Diff computation failed')
    } finally {
      setLoading(false)
    }
  }

  const severity = result?.summary?.severity
  const sevCls   = SEVERITY_CLS[severity] || SEVERITY_CLS.low

  return (
    <div className="space-y-5">

      {/* ── Selector panel ── */}
      <div className="rounded-xl border border-line bg-white dark:bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <GitCompare size={14} className="text-brass" />
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass-deep dark:text-brass">
            Select Circulars to Compare
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
          {/* Circular A */}
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-[#8b98aa]">
              Baseline Version (Older)
            </label>
            <select
              value={circularA}
              onChange={(e) => { setCircularA(e.target.value); setResult(null) }}
              className="w-full rounded-lg border border-line bg-paper dark:bg-surface px-3 py-2 text-sm text-ink dark:text-[#e8edf5] focus:outline-none focus:ring-2 focus:ring-brass/40"
            >
              <option value="">— Select circular —</option>
              {circulars.map((c) => (
                <option key={c.id} value={c.id} disabled={c.id === circularB}>
                  [{c.source}] {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Arrow */}
          <div className="flex items-end justify-center pb-2">
            <ArrowRight size={18} className="text-[#8b98aa]" />
          </div>

          {/* Circular B */}
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-[#8b98aa]">
              Updated Version (Newer)
            </label>
            <select
              value={circularB}
              onChange={(e) => { setCircularB(e.target.value); setResult(null) }}
              className="w-full rounded-lg border border-line bg-paper dark:bg-surface px-3 py-2 text-sm text-ink dark:text-[#e8edf5] focus:outline-none focus:ring-2 focus:ring-brass/40"
            >
              <option value="">— Select circular —</option>
              {circulars.map((c) => (
                <option key={c.id} value={c.id} disabled={c.id === circularA}>
                  [{c.source}] {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={runDiff}
            disabled={!canCompare || loading}
            className="flex items-center gap-2 rounded-lg bg-ink dark:bg-brass px-5 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-white dark:text-ink transition-opacity disabled:opacity-40"
          >
            {loading
              ? <Loader2 size={13} className="animate-spin" />
              : <GitCompare size={13} />
            }
            {loading ? 'Comparing…' : 'Run Diff'}
          </button>
          {result && (
            <button
              onClick={() => { setResult(null); setCircularA(''); setCircularB('') }}
              className="flex items-center gap-1.5 font-mono text-[11px] text-[#8b98aa] hover:text-ink dark:hover:text-[#e8edf5]"
            >
              <RefreshCw size={11} />
              Reset
            </button>
          )}
          {!canCompare && circularA && circularB && (
            <p className="font-mono text-[11px] text-danger dark:text-red-400">
              Select two different circulars
            </p>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 dark:bg-red-900/10 px-4 py-2.5">
            <AlertTriangle size={13} className="text-danger dark:text-red-400 flex-shrink-0" />
            <p className="text-[12px] text-danger dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonMetricCard key={i} />)}
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <>
          {/* Summary strip */}
          <div className="rounded-xl border border-line bg-white dark:bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass-deep dark:text-brass">
                  Change Impact Summary
                </p>
                <p className="mt-0.5 text-[12px] text-[#8b98aa]">
                  <span className="font-medium text-ink dark:text-[#e8edf5]">{result.circular_a.title}</span>
                  {' → '}
                  <span className="font-medium text-ink dark:text-[#e8edf5]">{result.circular_b.title}</span>
                </p>
              </div>
              {severity && (
                <span className={`rounded-full border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${sevCls.badge}`}>
                  {severity} impact
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Added',     value: result.summary.added,     color: 'text-success dark:text-green-400',  bg: 'bg-success/10 dark:bg-green-900/20', icon: Plus    },
                { label: 'Removed',   value: result.summary.removed,   color: 'text-danger dark:text-red-400',    bg: 'bg-danger/10 dark:bg-red-900/20',    icon: Minus   },
                { label: 'Modified',  value: result.summary.modified,  color: 'text-warning dark:text-amber-400', bg: 'bg-warning/10 dark:bg-amber-900/20', icon: RefreshCw },
                { label: 'Unchanged', value: result.summary.unchanged, color: 'text-[#8b98aa]',                   bg: 'bg-line/40 dark:bg-surface/40',      icon: CheckCircle2 },
              ].map(({ label, value, color, bg, icon: Icon }) => (
                <div key={label} className={`rounded-lg ${bg} px-4 py-3`}>
                  <div className="flex items-center gap-1.5">
                    <Icon size={11} className={color} />
                    <p className={`font-mono text-[9px] uppercase tracking-wide ${color}`}>{label}</p>
                  </div>
                  <p className={`mt-1 font-serif text-3xl font-semibold tabular-nums ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {result.summary.affected_departments?.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <p className="font-mono text-[10px] text-[#8b98aa]">Affected departments:</p>
                {result.summary.affected_departments.map((d) => (
                  <span key={d} className="rounded border border-line bg-paper dark:bg-surface px-2 py-0.5 font-mono text-[10px] text-ink dark:text-[#e8edf5]">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Added obligations */}
          <DiffSection
            title="New Obligations Added"
            icon={Plus}
            items={result.added}
            color="text-success dark:text-green-400"
            renderItem={(m) => <MapCard map={m} variant="added" />}
          />

          {/* Removed obligations */}
          <DiffSection
            title="Obligations Removed"
            icon={Minus}
            items={result.removed}
            color="text-danger dark:text-red-400"
            renderItem={(m) => <MapCard map={m} variant="removed" />}
          />

          {/* Modified obligations */}
          <DiffSection
            title="Modified Obligations"
            icon={RefreshCw}
            items={result.modified}
            color="text-warning dark:text-amber-400"
            renderItem={(item) => (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <p className="mb-1.5 font-mono text-[9px] uppercase tracking-wide text-[#8b98aa]">Before</p>
                    <MapCard map={item.old} variant="old" />
                  </div>
                  <div>
                    <p className="mb-1.5 font-mono text-[9px] uppercase tracking-wide text-[#8b98aa]">After</p>
                    <MapCard map={item.new} variant="new" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-[10px] text-[#8b98aa]">Changed:</p>
                  {item.changed_fields.map((f) => (
                    <span key={f} className="rounded bg-warning/10 dark:bg-amber-900/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-warning dark:text-amber-400">
                      {f}
                    </span>
                  ))}
                  {item.impact && (
                    <span className="font-mono text-[10px] text-[#8b98aa]">· {item.impact}</span>
                  )}
                </div>
              </div>
            )}
          />

          {/* Unchanged — collapsed by default */}
          {result.unchanged?.length > 0 && (
            <div className="rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3">
                <CheckCircle2 size={13} className="text-[#8b98aa]" />
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8b98aa]">
                  Unchanged Obligations — {result.unchanged.length} obligation{result.unchanged.length !== 1 ? 's' : ''} carried forward unmodified
                </p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {result.summary.added === 0 && result.summary.removed === 0 && result.summary.modified === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-line bg-white dark:bg-card py-12">
              <CheckCircle2 size={32} className="text-success dark:text-green-400" strokeWidth={1.5} />
              <p className="text-sm font-medium text-ink dark:text-[#e8edf5]">No regulatory changes detected</p>
              <p className="font-mono text-[11px] text-[#8b98aa]">
                All {result.summary.unchanged} obligations are identical between both circulars.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Empty state (no selection) ── */}
      {!result && !loading && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-line bg-white dark:bg-card py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-line bg-paper dark:bg-surface">
            <GitCompare size={22} className="text-brass" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-ink dark:text-[#e8edf5]">Regulatory Change Analysis</p>
            <p className="mt-1 font-mono text-[11px] text-[#8b98aa]">
              Select two circulars above and run a diff to see exactly what changed.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-paper dark:bg-surface px-4 py-2">
            <Info size={11} className="text-brass flex-shrink-0" />
            <p className="font-mono text-[10px] text-[#8b98aa]">
              Works offline · No AI required · Results in under 1 second
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
