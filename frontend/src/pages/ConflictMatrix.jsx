/**
 * PRAGMA — Cross-Regulator Conflict Matrix
 *
 * Shows where multiple regulators (RBI, SEBI, MCA) impose overlapping or
 * conflicting obligations on the same departments within the same timeframe.
 *
 * Conflict types:
 *   OVERLAP         — Same department, similar obligation, different regulator
 *   DEADLINE CLASH  — Overlapping deadlines within 60 days
 *   PRIORITY MISMATCH — Same obligation rated differently by two regulators
 *   WORKLOAD SURGE  — 3+ obligations from 2+ regulators due within 90 days
 */

import { useState, useEffect } from 'react'
import api from '../services/api'
import {
  AlertTriangle, Layers, Clock, TrendingUp, Shield,
  RefreshCw, Building2, Calendar, ChevronDown, ChevronRight, Loader2,
} from 'lucide-react'

const TYPE_CFG = {
  overlap: {
    label:   'Regulatory Overlap',
    icon:    Layers,
    color:   'text-brass dark:text-brass',
    bg:      'bg-brass/10 dark:bg-brass/10',
    border:  'border-brass/30',
    badgeCls:'bg-brass/10 dark:bg-brass/10 text-brass-deep dark:text-brass border-brass/30',
    dot:     'bg-brass',
  },
  deadline_clash: {
    label:   'Deadline Clash',
    icon:    Clock,
    color:   'text-danger dark:text-red-400',
    bg:      'bg-danger/5 dark:bg-red-900/10',
    border:  'border-danger/20',
    badgeCls:'bg-danger/10 dark:bg-red-900/30 text-danger dark:text-red-400 border-danger/20',
    dot:     'bg-danger',
  },
  priority_mismatch: {
    label:   'Priority Mismatch',
    icon:    TrendingUp,
    color:   'text-warning dark:text-amber-400',
    bg:      'bg-warning/5 dark:bg-amber-900/10',
    border:  'border-warning/20',
    badgeCls:'bg-warning/10 dark:bg-amber-900/20 text-warning dark:text-amber-400 border-warning/20',
    dot:     'bg-warning',
  },
  workload_surge: {
    label:   'Workload Surge',
    icon:    AlertTriangle,
    color:   'text-danger dark:text-red-400',
    bg:      'bg-danger/5 dark:bg-red-900/10',
    border:  'border-danger/20',
    badgeCls:'bg-danger/10 dark:bg-red-900/30 text-danger dark:text-red-400 border-danger/20',
    dot:     'bg-danger animate-pulse',
  },
}

const SEVERITY_PILL = {
  high:   'border-danger/30 bg-danger/10 dark:bg-red-900/30 text-danger dark:text-red-400',
  medium: 'border-warning/30 bg-warning/10 dark:bg-amber-900/20 text-warning dark:text-amber-400',
  low:    'border-line bg-paper dark:bg-surface text-[#8b98aa]',
}

function ConflictCard({ conflict }) {
  const [open, setOpen] = useState(false)
  const cfg = TYPE_CFG[conflict.type] || TYPE_CFG.overlap
  const Icon = cfg.icon

  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <button
        className="w-full px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <Icon size={14} className={`mt-0.5 flex-shrink-0 ${cfg.color}`} />
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium leading-snug text-ink dark:text-[#e8edf5]">
                {conflict.description}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {conflict.department && (
                  <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-[#8b98aa]">
                    <Building2 size={9} />
                    {conflict.department}
                  </span>
                )}
                {conflict.regulators?.map((r) => (
                  <span key={r} className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold ${cfg.badgeCls}`}>
                    {r}
                  </span>
                ))}
                {conflict.similarity != null && (
                  <span className="font-mono text-[9px] text-[#8b98aa]">
                    {(conflict.similarity * 100).toFixed(0)}% overlap
                  </span>
                )}
                {conflict.gap_days != null && (
                  <span className="font-mono text-[9px] text-[#8b98aa]">
                    {conflict.gap_days}d gap
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase ${SEVERITY_PILL[conflict.severity] || SEVERITY_PILL.low}`}>
              {conflict.severity}
            </span>
            {open ? <ChevronDown size={13} className="text-[#8b98aa]" /> : <ChevronRight size={13} className="text-[#8b98aa]" />}
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-line/60 px-4 pb-4 pt-3">
          {conflict.map_a && conflict.map_b && (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {[conflict.map_a, conflict.map_b].map((m, i) => (
                <div key={i} className="rounded-lg border border-line bg-white dark:bg-card p-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="rounded bg-line dark:bg-surface/80 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-ink dark:text-[#e8edf5]">
                      {m.regulator}
                    </span>
                    <span className="font-mono text-[9px] text-[#8b98aa]">{m.department}</span>
                  </div>
                  <p className="text-[12px] leading-snug text-ink dark:text-[#e8edf5]">{m.action}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-mono text-[9px] text-[#8b98aa]">{m.priority}</span>
                    {m.deadline && (
                      <span className="flex items-center gap-1 font-mono text-[9px] text-[#8b98aa]">
                        <Calendar size={9} />
                        {m.deadline}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {conflict.maps && (
            <div className="space-y-2">
              {conflict.maps.map((m, i) => (
                <div key={i} className="rounded-lg border border-line bg-white dark:bg-card p-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="rounded bg-line dark:bg-surface/80 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-ink dark:text-[#e8edf5]">
                      {m.regulator}
                    </span>
                    <span className="font-mono text-[9px] text-[#8b98aa]">{m.department}</span>
                  </div>
                  <p className="text-[12px] leading-snug text-ink dark:text-[#e8edf5]">{m.action}</p>
                  {m.deadline && (
                    <p className="mt-1 flex items-center gap-1 font-mono text-[9px] text-[#8b98aa]">
                      <Calendar size={9} />
                      Due {m.deadline}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SectionPanel({ title, icon: Icon, items, type, emptyMsg }) {
  const cfg = TYPE_CFG[type] || TYPE_CFG.overlap
  return (
    <div className="rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-paper/40 dark:bg-surface/40 px-5 py-3">
        <Icon size={13} className={cfg.color} />
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass-deep dark:text-brass">
          {cfg.label}
        </p>
        <span className="ml-auto rounded-full bg-line dark:bg-surface/60 px-2 py-0.5 font-mono text-[9px] font-bold text-ink dark:text-[#e8edf5]">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="font-mono text-[11px] text-[#8b98aa]">{emptyMsg}</p>
        </div>
      ) : (
        <div className="space-y-2 p-4">
          {items.map((c, i) => (
            <ConflictCard key={i} conflict={{ ...c, type }} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ConflictMatrix() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: res } = await api.get('/insights/conflicts')
      setData(res)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Conflict detection failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const summary = data?.summary
  const overallSev = summary?.overall_severity || 'low'

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="rounded-xl border border-line bg-white dark:bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-brass" />
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass-deep dark:text-brass">
                Cross-Regulator Conflict Analysis
              </p>
            </div>
            <p className="mt-1 text-[12px] text-[#8b98aa]">
              Detects overlapping obligations, deadline clashes, and workload surges across RBI, SEBI, and MCA circulars.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-paper dark:bg-surface px-3 py-1.5 font-mono text-[10px] text-ink dark:text-[#e8edf5] hover:bg-line/30 disabled:opacity-50"
          >
            {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 dark:bg-red-900/10 px-5 py-4">
          <AlertTriangle size={14} className="text-danger dark:text-red-400 flex-shrink-0" />
          <p className="text-[12px] text-danger dark:text-red-400">{error}</p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && !data && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-line bg-white dark:bg-card py-16">
          <Loader2 size={24} className="animate-spin text-brass" />
          <p className="font-mono text-[11px] text-[#8b98aa]">Scanning circulars for conflicts…</p>
        </div>
      )}

      {/* ── Summary strip ── */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Overlaps',     value: summary.overlaps,            cfg: TYPE_CFG.overlap },
            { label: 'Deadline Clashes', value: summary.deadline_clashes, cfg: TYPE_CFG.deadline_clash },
            { label: 'Priority Gaps', value: summary.priority_mismatches, cfg: TYPE_CFG.priority_mismatch },
            { label: 'Workload Surges', value: summary.workload_surges,   cfg: TYPE_CFG.workload_surge },
          ].map(({ label, value, cfg }) => (
            <div key={label} className="rounded-xl border border-line bg-white dark:bg-card px-5 py-4">
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                <p className="truncate font-mono text-[9px] uppercase tracking-[0.1em] text-[#8b98aa]">{label}</p>
              </div>
              <p className="mt-1.5 font-serif text-3xl font-semibold tabular-nums text-ink dark:text-[#e8edf5]">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Regulator pair heatmap ── */}
      {summary?.regulator_pairs && Object.keys(summary.regulator_pairs).length > 0 && (
        <div className="rounded-xl border border-line bg-white dark:bg-card p-5">
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-brass-deep dark:text-brass">
            Conflict Frequency by Regulator Pair
          </p>
          <div className="space-y-2">
            {Object.entries(summary.regulator_pairs)
              .sort(([, a], [, b]) => b - a)
              .map(([pair, count]) => {
                const max = Math.max(...Object.values(summary.regulator_pairs))
                const pct = max ? (count / max) * 100 : 0
                return (
                  <div key={pair}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold text-ink dark:text-[#e8edf5]">{pair}</span>
                      <span className="font-mono text-[10px] tabular-nums text-[#8b98aa]">{count} conflict{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-2 rounded-full bg-line dark:bg-surface overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brass transition-all duration-700"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ── Conflict sections ── */}
      {data && (
        <>
          <SectionPanel
            title="Regulatory Overlaps"
            icon={Layers}
            items={data.overlaps || []}
            type="overlap"
            emptyMsg="No regulatory overlaps detected"
          />
          <SectionPanel
            title="Deadline Clashes"
            icon={Clock}
            items={data.deadline_clashes || []}
            type="deadline_clash"
            emptyMsg="No deadline clashes within 60 days"
          />
          <SectionPanel
            title="Priority Mismatches"
            icon={TrendingUp}
            items={data.priority_mismatches || []}
            type="priority_mismatch"
            emptyMsg="No priority mismatches detected"
          />
          <SectionPanel
            title="Workload Surges"
            icon={AlertTriangle}
            items={data.workload_surges || []}
            type="workload_surge"
            emptyMsg="No department workload surges in next 90 days"
          />

          {summary?.total_conflicts === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-line bg-white dark:bg-card py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-success/40 bg-success/10 dark:bg-green-900/20">
                <Shield size={20} className="text-success dark:text-green-400" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-ink dark:text-[#e8edf5]">No cross-regulator conflicts detected</p>
              <p className="font-mono text-[11px] text-[#8b98aa]">
                All {Object.values(summary?.regulator_pairs || {}).reduce((a, b) => a + b, 0) === 0
                  ? 'ingested'
                  : 'cross-regulator'} obligations are consistent.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
