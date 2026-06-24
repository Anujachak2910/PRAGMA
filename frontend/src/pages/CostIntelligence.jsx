import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useCirculars } from '../hooks/useCirculars'
import { getCircularCost, getPortfolioCost } from '../api/insights'
import { SkeletonMetricCard, SkeletonTableRows } from '../components/shared/Skeleton'
import {
  DollarSign, TrendingUp, Clock, AlertTriangle, Building2,
  ChevronDown, ChevronRight, RefreshCw, BarChart2, Layers,
  ShieldAlert, ArrowRight, Info,
} from 'lucide-react'

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtCrore = (n) => {
  if (n == null) return '₹0'
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`
  return `₹${n.toLocaleString('en-IN')}`
}

const fmtDays = (n) => {
  if (n == null) return '0d'
  if (n >= 365) return `${(n / 365).toFixed(1)}y`
  if (n >= 30)  return `${Math.round(n / 30)}mo`
  return `${n}d`
}

const PRIORITY_DOT = {
  Critical: 'bg-danger',
  High:     'bg-warning',
  Medium:   'bg-brass',
  Low:      'bg-[#8b98aa]',
}

const PRIORITY_TEXT = {
  Critical: 'text-danger-700 dark:text-red-400',
  High:     'text-warning-700 dark:text-amber-400',
  Medium:   'text-brass-deep dark:text-brass',
  Low:      'text-[#8b98aa]',
}

const DEPT_COLORS = {
  IT:         '#2B4A8F',
  Compliance: '#c69b4f',
  Risk:       '#7C3AED',
  Legal:      '#0891B2',
  Treasury:   '#065F46',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, dot, trend, trendDir }) {
  const trendCls = {
    up:   'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-600 dark:text-red-400',
    warn: 'text-amber-600 dark:text-amber-400',
    ok:   'text-emerald-600 dark:text-emerald-400',
  }[trendDir] || 'text-[#8b98aa]'

  return (
    <div className="rounded-xl border border-line bg-white dark:bg-card px-5 py-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dot}`} />
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8b98aa]">
          {label}
        </p>
      </div>
      <p className="font-serif text-3xl font-semibold tabular-nums leading-none text-ink dark:text-[#e8edf5]">
        {value}
      </p>
      {sub && <p className="mt-1 text-[11px] text-[#8b98aa]">{sub}</p>}
      {trend && (
        <p className={`mt-1 font-mono text-[10px] font-medium ${trendCls}`}>
          {trendDir === 'up' ? '↑' : trendDir === 'down' ? '↓' : '●'} {trend}
        </p>
      )}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, mono }) {
  return (
    <div className="flex items-center gap-2 border-b border-line bg-paper/40 dark:bg-surface/40 px-5 py-3 flex-shrink-0">
      <Icon size={13} className="text-brass flex-shrink-0" />
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass-deep dark:text-brass">
        {title}
      </p>
      {mono && (
        <span className="ml-auto font-mono text-[9px] text-[#8b98aa]">{mono}</span>
      )}
    </div>
  )
}

function ROIBadge({ value }) {
  if (!value) return null
  const cls = value >= 3 ? 'text-success-700 dark:text-green-400 bg-success-50 dark:bg-green-900/20 border-success-200 dark:border-green-800/60'
    : value >= 1.5        ? 'text-warning-700 dark:text-amber-400 bg-warning-50 dark:bg-amber-900/20 border-warning-200 dark:border-amber-800/60'
    :                       'text-danger-700 dark:text-red-400 bg-danger-50 dark:bg-red-900/20 border-danger-200 dark:border-red-800/60'
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${cls}`}>
      {value}× ROI
    </span>
  )
}

function DeptBar({ row, maxCost }) {
  const pct    = maxCost > 0 ? (row.total_cost / maxCost) * 100 : 0
  const color  = DEPT_COLORS[row.department] || '#8b98aa'

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 flex-shrink-0">
        <p className="font-mono text-[11px] font-semibold text-ink dark:text-[#e8edf5]">
          {row.department}
        </p>
        <p className="font-mono text-[9px] text-[#8b98aa]">
          {row.maps_count} MAP{row.maps_count !== 1 ? 's' : ''}
          {row.critical_count > 0 && (
            <span className="ml-1 text-red-500 dark:text-red-400">· {row.critical_count} critical</span>
          )}
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-2.5 rounded-full bg-line dark:bg-surface overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
          />
        </div>
      </div>
      <div className="w-20 flex-shrink-0 text-right">
        <p className="font-mono text-[11px] font-semibold tabular-nums text-ink dark:text-[#e8edf5]">
          {fmtCrore(row.total_cost)}
        </p>
        <p className="font-mono text-[9px] text-[#8b98aa]">{row.total_days}d</p>
      </div>
      <div className="w-20 flex-shrink-0 text-right">
        <p className="font-mono text-[10px] text-[#8b98aa]">
          {fmtCrore(row.penalty_exposure)}
        </p>
        <p className="font-mono text-[9px] text-[#8b98aa]">exposure</p>
      </div>
      <div className="w-14 flex-shrink-0 text-right">
        <ROIBadge value={row.roi_x} />
      </div>
    </div>
  )
}

function MAPRow({ m }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border-b border-line last:border-b-0 transition-colors ${
      open ? 'bg-paper/40 dark:bg-surface/40' : 'hover:bg-paper/20 dark:hover:bg-surface/20'
    }`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-5 py-3 flex items-center gap-3"
      >
        <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${PRIORITY_DOT[m.priority] || 'bg-slate-400'}`} />
        <div className="flex-1 min-w-0">
          <p className="truncate text-[12px] text-ink dark:text-[#e8edf5]">{m.action}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-[9px] text-[#8b98aa]">{m.department}</span>
            <span className={`font-mono text-[9px] font-semibold ${PRIORITY_TEXT[m.priority] || ''}`}>
              {m.priority}
            </span>
            {m.deadline && (
              <span className="font-mono text-[9px] text-[#8b98aa]">Due {m.deadline}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="font-mono text-[11px] font-semibold tabular-nums text-ink dark:text-[#e8edf5]">
              {fmtCrore(m.cost_inr)}
            </p>
            <p className="font-mono text-[9px] text-[#8b98aa]">{m.estimated_days}d</p>
          </div>
          <div className="text-right w-16">
            <p className="font-mono text-[10px] text-[#8b98aa]">{fmtCrore(m.penalty_inr)}</p>
            <p className="font-mono text-[9px] text-[#8b98aa]">exposure</p>
          </div>
          <ROIBadge value={m.roi_x} />
          {open ? <ChevronDown size={12} className="text-[#8b98aa]" /> : <ChevronRight size={12} className="text-[#8b98aa]" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-3 pt-0 grid grid-cols-2 gap-4 sm:grid-cols-4 text-[11px] animate-fadeIn">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-wide text-[#8b98aa] mb-0.5">Effort</p>
            <p className="font-semibold text-ink dark:text-[#e8edf5]">{m.estimated_days} person-days</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-wide text-[#8b98aa] mb-0.5">Implementation Cost</p>
            <p className="font-semibold text-ink dark:text-[#e8edf5]">{fmtCrore(m.cost_inr)}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-wide text-[#8b98aa] mb-0.5">Penalty Exposure</p>
            <p className="font-semibold text-red-600 dark:text-red-400">{fmtCrore(m.penalty_inr)}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-wide text-[#8b98aa] mb-0.5">ROI of Compliance</p>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">{m.roi_x}× return</p>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-line bg-paper dark:bg-surface">
        <Icon size={20} className="text-[#8b98aa]" />
      </div>
      <p className="font-serif text-base font-semibold text-ink dark:text-[#e8edf5]">{title}</p>
      <p className="text-sm text-[#8b98aa] max-w-xs">{sub}</p>
    </div>
  )
}

// ── Circular view ─────────────────────────────────────────────────────────────

function CircularCostView({ circularId }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  useEffect(() => {
    if (!circularId) return
    setLoading(true)
    setError(null)
    getCircularCost(circularId)
      .then(setData)
      .catch(() => setError('Could not load cost analysis.'))
      .finally(() => setLoading(false))
  }, [circularId])

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonMetricCard key={i} />)}
        </div>
        <div className="h-40 rounded-xl border border-line bg-white dark:bg-card" />
        <div className="h-64 rounded-xl border border-line bg-white dark:bg-card" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/10 p-6 text-center">
        <AlertTriangle size={20} className="mx-auto mb-2 text-red-500" />
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const { summary, department_breakdown, map_breakdown } = data
  const maxCost = Math.max(...(department_breakdown || []).map((d) => d.total_cost), 1)

  // Chart data for recharts
  const chartData = (department_breakdown || []).map((d) => ({
    name:    d.department,
    cost:    Math.round(d.total_cost / 100_000),   // in lakhs
    penalty: Math.round(d.penalty_exposure / 100_000),
    days:    d.total_days,
  }))

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard
          label="Total Implementation Cost"
          value={fmtCrore(summary.total_cost_inr)}
          sub={`${summary.active_maps} active MAPs`}
          dot="bg-brass"
          trend={`${summary.departments_affected} department${summary.departments_affected !== 1 ? 's' : ''} affected`}
          trendDir="warn"
        />
        <KPICard
          label="Total Person-Days"
          value={`${summary.total_person_days}d`}
          sub={`Critical path: ${summary.critical_path_days} days`}
          dot="bg-violet-500"
          trend={`~${Math.ceil(summary.critical_path_days / 21)} months wall-clock`}
          trendDir="warn"
        />
        <KPICard
          label="Penalty Exposure"
          value={fmtCrore(summary.total_penalty_inr)}
          sub="if non-compliant"
          dot="bg-red-500"
          trend="Regulatory enforcement risk"
          trendDir="down"
        />
        <KPICard
          label="Compliance ROI"
          value={`${summary.roi_x}×`}
          sub="penalty avoided vs. cost"
          dot={summary.roi_x >= 2 ? 'bg-emerald-500' : 'bg-amber-400'}
          trend={summary.roi_x >= 2 ? 'Strong investment case' : 'Below 2× — review scope'}
          trendDir={summary.roi_x >= 2 ? 'up' : 'warn'}
        />
      </div>

      {/* ── Department Breakdown ── */}
      <div className="rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
        <SectionHeader icon={Building2} title="Department Burden Analysis" mono="Cost · Days · Penalty · ROI" />
        <div className="p-5 space-y-4">
          {(department_breakdown || []).length === 0 ? (
            <EmptyState icon={Building2} title="No active MAPs" sub="All MAPs are completed or rejected." />
          ) : (
            department_breakdown.map((row) => (
              <DeptBar key={row.department} row={row} maxCost={maxCost} />
            ))
          )}
        </div>
      </div>

      {/* ── Dept cost chart ── */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
          <SectionHeader icon={BarChart2} title="Cost vs Penalty Exposure by Department" mono="₹ Lakhs" />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line, #e5e7eb)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: '#8b98aa' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#8b98aa' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-card, #fff)',
                    border: '1px solid var(--color-line, #e5e7eb)',
                    borderRadius: 8,
                    fontSize: 11,
                    fontFamily: 'IBM Plex Mono',
                  }}
                  formatter={(v, name) => [`₹${v}L`, name === 'cost' ? 'Impl. Cost' : 'Penalty Risk']}
                />
                <Bar dataKey="cost" fill="#c69b4f" radius={[3, 3, 0, 0]} name="cost">
                  {chartData.map((d) => (
                    <Cell key={d.name} fill={DEPT_COLORS[d.name] || '#c69b4f'} />
                  ))}
                </Bar>
                <Bar dataKey="penalty" fill="#B42318" radius={[3, 3, 0, 0]} name="penalty" opacity={0.35} />
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-1 font-mono text-[9px] text-[#8b98aa]">
              Solid bars = implementation cost · Faded bars = regulatory penalty exposure
            </p>
          </div>
        </div>
      )}

      {/* ── MAP-level breakdown ── */}
      <div className="rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
        <SectionHeader
          icon={Layers}
          title="MAP-Level Cost Breakdown"
          mono={`${(map_breakdown || []).length} MAPs`}
        />
        <div className="divide-y divide-line">
          {(map_breakdown || []).length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState icon={Layers} title="No MAPs" sub="Upload a circular to generate MAPs." />
            </div>
          ) : (
            (map_breakdown || [])
              .sort((a, b) => b.cost_inr - a.cost_inr)
              .map((m) => <MAPRow key={m.map_id} m={m} />)
          )}
        </div>
      </div>

      {/* ── Methodology note ── */}
      <div className="flex items-start gap-2 rounded-lg border border-line bg-paper/40 dark:bg-surface/40 px-4 py-3">
        <Info size={12} className="mt-0.5 text-[#8b98aa] flex-shrink-0" />
        <p className="font-mono text-[9px] text-[#8b98aa] leading-relaxed">
          Cost estimates are based on industry-benchmark rate cards for Indian banking sector professionals
          (fully-loaded daily cost). Effort is estimated from action complexity, priority tier, and
          regulatory mandate language. Penalty exposure is derived from historical RBI/SEBI enforcement
          data. All figures are indicative; configure rate card to match your organisation.
        </p>
      </div>
    </div>
  )
}

// ── Portfolio view ────────────────────────────────────────────────────────────

function PortfolioCostView({ onDrillDown }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getPortfolioCost()
      .then(setData)
      .catch(() => setError('Could not load portfolio cost data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonMetricCard key={i} />)}
        </div>
        <div className="h-40 rounded-xl border border-line bg-white dark:bg-card" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/10 p-6 text-center">
        <AlertTriangle size={20} className="mx-auto mb-2 text-red-500" />
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const { summary, department_breakdown, circular_breakdown } = data
  const maxCost = Math.max(...(department_breakdown || []).map((d) => d.total_cost), 1)

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <KPICard
            label="Total Compliance Cost"
            value={fmtCrore(summary.total_cost_inr)}
            sub={`${summary.circulars_count} circulars · ${summary.active_maps} active MAPs`}
            dot="bg-brass"
            trend={summary.total_cost_inr > 0 ? 'Active implementation burden' : 'No active obligations'}
            trendDir={summary.total_cost_inr > 0 ? 'warn' : 'ok'}
          />
        </div>
        <div className="lg:col-span-2">
          <KPICard
            label="Total Penalty Exposure"
            value={fmtCrore(summary.total_penalty_inr)}
            sub="if all active MAPs default"
            dot="bg-red-500"
            trend="Regulatory enforcement risk"
            trendDir="down"
          />
        </div>
        <div className="lg:col-span-2">
          <KPICard
            label="Portfolio ROI"
            value={`${summary.portfolio_roi_x}×`}
            sub="penalty avoided vs. cost"
            dot={summary.portfolio_roi_x >= 2 ? 'bg-emerald-500' : 'bg-amber-400'}
            trend={`${summary.total_person_days} person-days total`}
            trendDir={summary.portfolio_roi_x >= 2 ? 'up' : 'warn'}
          />
        </div>
      </div>

      {/* ── Department burden ── */}
      <div className="rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
        <SectionHeader icon={Building2} title="Cross-Circular Department Burden" mono="Portfolio view" />
        <div className="p-5 space-y-4">
          {(department_breakdown || []).length === 0 ? (
            <EmptyState icon={Building2} title="No active compliance obligations" sub="Upload circulars to see cost intelligence." />
          ) : (
            department_breakdown.map((row) => (
              <DeptBar key={row.department} row={row} maxCost={maxCost} />
            ))
          )}
        </div>
      </div>

      {/* ── Per-circular breakdown ── */}
      {(circular_breakdown || []).length > 0 && (
        <div className="rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
          <SectionHeader icon={Layers} title="Cost by Circular" mono="Sorted by cost" />
          <div className="divide-y divide-line">
            {circular_breakdown.map((c) => (
              <button
                key={c.circular_id}
                onClick={() => onDrillDown(c.circular_id)}
                className="w-full text-left px-5 py-3.5 hover:bg-paper/40 dark:hover:bg-surface/40 transition-colors flex items-center gap-3"
              >
                <span className="h-6 w-6 flex-shrink-0 rounded bg-brass/10 dark:bg-brass/5 flex items-center justify-center">
                  <span className="font-mono text-[9px] font-bold text-brass">{c.source}</span>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[12px] font-medium text-ink dark:text-[#e8edf5]">{c.title}</p>
                  <p className="font-mono text-[9px] text-[#8b98aa]">{c.maps_count} active MAPs</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="font-mono text-[11px] font-semibold text-ink dark:text-[#e8edf5]">{fmtCrore(c.total_cost_inr)}</p>
                    <p className="font-mono text-[9px] text-[#8b98aa]">impl. cost</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] text-[#8b98aa]">{fmtCrore(c.penalty_inr)}</p>
                    <p className="font-mono text-[9px] text-[#8b98aa]">exposure</p>
                  </div>
                  <ROIBadge value={c.roi_x} />
                  <ArrowRight size={12} className="text-[#8b98aa]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CostIntelligence() {
  const { circulars, loading: circsLoading } = useCirculars()
  const [searchParams, setSearchParams]      = useSearchParams()

  // Initialise from URL search params so deep-links and drill-down work
  const [mode, setMode]         = useState(() => searchParams.get('mode') || 'portfolio')
  const [selectedId, setSelectedId] = useState(() => searchParams.get('circular') || '')

  // Sync state to URL for bookmarkability
  useEffect(() => {
    const params = {}
    if (mode !== 'portfolio') params.mode = mode
    if (selectedId)           params.circular = selectedId
    setSearchParams(params, { replace: true })
  }, [mode, selectedId, setSearchParams])

  // Default to first circular when switching to circular mode with none selected
  useEffect(() => {
    if (!selectedId && circulars.length > 0) {
      setSelectedId(circulars[0].id)
    }
  }, [circulars, selectedId])

  // Drill-down from portfolio view into a specific circular
  const handleDrillDown = useCallback((circularId) => {
    setSelectedId(circularId)
    setMode('circular')
  }, [])

  return (
    <div className="space-y-4">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-brass" />
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8b98aa]">
            Compliance Cost Intelligence
          </p>
        </div>

        <div className="h-4 w-px bg-line" />

        {/* View toggle */}
        <div className="flex rounded-lg border border-line overflow-hidden">
          <button
            onClick={() => setMode('portfolio')}
            className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
              mode === 'portfolio'
                ? 'bg-ink text-white dark:bg-white dark:text-ink'
                : 'bg-white dark:bg-card text-[#8b98aa] hover:text-ink dark:hover:text-[#e8edf5]'
            }`}
          >
            Portfolio View
          </button>
          <button
            onClick={() => setMode('circular')}
            className={`px-3 py-1.5 text-[11px] font-medium transition-colors border-l border-line ${
              mode === 'circular'
                ? 'bg-ink text-white dark:bg-white dark:text-ink'
                : 'bg-white dark:bg-card text-[#8b98aa] hover:text-ink dark:hover:text-[#e8edf5]'
            }`}
          >
            Circular Detail
          </button>
        </div>

        {mode === 'circular' && (
          <div className="relative">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={circsLoading}
              className="appearance-none rounded-lg border border-line bg-white dark:bg-surface py-1.5 pl-3 pr-8 text-sm font-medium text-ink dark:text-[#e8edf5] focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 min-w-[300px] disabled:opacity-60"
            >
              {circulars.map((c) => (
                <option key={c.id} value={c.id}>{c.source} — {c.title}</option>
              ))}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b98aa]" />
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5 rounded-md border border-line bg-paper/40 dark:bg-surface/40 px-2.5 py-1">
          <ShieldAlert size={10} className="text-brass" />
          <p className="font-mono text-[9px] text-[#8b98aa]">
            Estimates based on industry benchmark rate cards · Offline computation
          </p>
        </div>
      </div>

      {/* ── Main content ── */}
      {mode === 'portfolio'
        ? <PortfolioCostView onDrillDown={handleDrillDown} />
        : selectedId
          ? <CircularCostView circularId={selectedId} />
          : (
            <div className="rounded-xl border border-line bg-white dark:bg-card py-12">
              <EmptyState
                icon={DollarSign}
                title="No circulars ingested"
                sub="Upload a regulatory circular to generate cost intelligence."
              />
            </div>
          )
      }
    </div>
  )
}
