import { useMemo, useState, useCallback, Fragment } from 'react'
import { useMaps } from '../hooks/useMaps'
import { useCirculars } from '../hooks/useCirculars'
import { updateMAPStatus } from '../api/maps'
import { useAppContext } from '../contexts/AppContext'
import StatusBadge from '../components/shared/StatusBadge'
import PriorityBadge from '../components/shared/PriorityBadge'
import { SkeletonTableRows } from '../components/shared/Skeleton'
import TraceabilityDrawer from '../components/shared/TraceabilityDrawer'
import RiskPanel from '../components/shared/RiskPanel'
import { formatDate, formatDateTime } from '../utils/formatters'
import { DEPARTMENTS } from '../utils/constants'
import {
  Search, ChevronUp, ChevronDown, SlidersHorizontal, X,
  Copy, Check, ChevronRight, Sparkles, Building2, Clock,
  Brain,
} from 'lucide-react'

const STATUS_OPTIONS   = ['Pending', 'Approved', 'Rejected', 'In Progress', 'Completed']
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low']

const eq = (a, b) => (a || '').toString().trim().toLowerCase() === (b || '').toString().trim().toLowerCase()
const sk = (s) => (s || '').toString().trim().toUpperCase().replace(/\s+/g, '_')
const sl = (s) => (s || '').toString().trim().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const NEXT_STEP = {
  APPROVED:    { to: 'IN_PROGRESS', label: 'Start work',    cls: 'border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30' },
  IN_PROGRESS: { to: 'COMPLETED',   label: 'Mark complete', cls: 'border-success-200 dark:border-green-700 text-success-700 dark:text-green-400 hover:bg-success-50 dark:hover:bg-green-900/30' },
}

const CONF_CLS = (s) => {
  if (!s) return 'text-gray-400'
  if (s >= 0.85) return 'text-success-700 dark:text-green-400'
  if (s >= 0.65) return 'text-warning-700 dark:text-amber-400'
  return 'text-danger-700 dark:text-red-400'
}

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ChevronUp size={11} className="text-gray-300 dark:text-gray-700" />
  return sortDir === 'asc'
    ? <ChevronUp  size={11} className="text-brass" />
    : <ChevronDown size={11} className="text-brass" />
}

function Th({ col, label, className = '', sortCol, sortDir, onSort }) {
  return (
    <th
      className={`px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-gray-500 dark:text-gray-600 ${
        col ? 'cursor-pointer select-none hover:text-ink dark:hover:text-gray-300' : ''
      } ${className}`}
      onClick={() => col && onSort(col)}
    >
      <div className="flex items-center gap-1">
        {label}
        {col && <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />}
      </div>
    </th>
  )
}

function ExpandedRow({ m, circular, onOpenTraceability }) {
  const [copied, setCopied] = useState(false)

  const copyId = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(m.id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <tr className="animate-fadeIn">
      <td colSpan={10} className="border-b border-line dark:border-gray-800 bg-primary-50/20 dark:bg-primary-900/10 px-5 py-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Full action text */}
          <div className="lg:col-span-2">
            <p className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-gray-400 dark:text-gray-600">
              Full Action Text
            </p>
            <p className="text-[13px] leading-relaxed text-ink dark:text-gray-200">{m.action}</p>
          </div>

          {/* Validation notes */}
          {m.validation_notes && (
            <div>
              <p className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-gray-400 dark:text-gray-600">
                Validation Notes
              </p>
              <p className="text-[12px] leading-relaxed text-gray-600 dark:text-gray-400">{m.validation_notes}</p>
            </div>
          )}

          {/* Metadata strip */}
          <div className="sm:col-span-2 lg:col-span-3 border-t border-line/60 dark:border-gray-800 pt-3">
            <div className="flex flex-wrap items-center gap-4 text-[12px] text-gray-500 dark:text-gray-500">
              {/* MAP ID + copy */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-600">ID</span>
                <span className="font-mono text-gray-600 dark:text-gray-400">{m.id}</span>
                <button
                  onClick={copyId}
                  className="flex items-center gap-1 rounded border border-line dark:border-gray-700 bg-white dark:bg-gray-800 px-1.5 py-0.5 text-gray-400 transition-colors hover:border-primary-300 hover:text-ink dark:hover:text-gray-200"
                  title="Copy MAP ID"
                >
                  {copied
                    ? <><Check size={10} className="text-success dark:text-green-400" /><span className="font-mono text-[9px] text-success-700 dark:text-green-400">Copied</span></>
                    : <><Copy size={10} /><span className="font-mono text-[9px]">Copy ID</span></>
                  }
                </button>
              </div>

              {circular && (
                <div className="flex items-center gap-1.5">
                  <Building2 size={11} className="text-gray-400 dark:text-gray-600" />
                  <span className="dark:text-gray-400">{circular.source} — {circular.title}</span>
                </div>
              )}

              {m.confidence_score != null && (
                <div className="flex items-center gap-1.5">
                  <Sparkles size={11} className="text-violet-400" />
                  <span className={CONF_CLS(m.confidence_score)}>
                    AI Confidence: {Math.round(m.confidence_score * 100)}%
                  </span>
                </div>
              )}

              {m.created_at && (
                <div className="flex items-center gap-1.5">
                  <Clock size={11} className="text-gray-400 dark:text-gray-600" />
                  <span>Created {formatDateTime(m.created_at)}</span>
                </div>
              )}

              {/* Why was this generated? button */}
              {m.reasoning && (
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenTraceability(m) }}
                  className="ml-auto flex items-center gap-1.5 rounded-md border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-3 py-1 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
                >
                  <Brain size={12} />
                  <span className="font-mono text-[10px] font-semibold">Why was this generated?</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Risk Panel — Phase 3 */}
        {m.risk && <RiskPanel map={m} />}
      </td>
    </tr>
  )
}

export default function MAPsView() {
  const { maps, loading, usingMock, refresh } = useMaps()
  const { byId: circularById }               = useCirculars()
  const { setNotification }                  = useAppContext()

  const [search, setSearch]         = useState('')
  const [status, setStatus]         = useState('')
  const [department, setDept]       = useState('')
  const [priority, setPriority]     = useState('')
  const [sortCol, setSortCol]       = useState('created_at')
  const [sortDir, setSortDir]       = useState('desc')
  const [expandedId, setExpId]      = useState(null)
  const [busyId, setBusyId]         = useState(null)
  const [traceMap, setTraceMap]     = useState(null)

  const toggleSort = useCallback((col) => {
    setSortCol((prev) => {
      if (prev === col) { setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); return col }
      setSortDir('asc'); return col
    })
  }, [])

  const toggleExpand = useCallback((id) => setExpId((prev) => (prev === id ? null : id)), [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return maps
      .filter((m) =>
        (!q || m.action?.toLowerCase().includes(q) || m.source_clause?.toLowerCase().includes(q) || m.id?.includes(q)) &&
        (!status     || eq(sl(m.status),  status)) &&
        (!department || eq(m.department,  department)) &&
        (!priority   || eq(m.priority,    priority)),
      )
      .sort((a, b) => {
        let av = a[sortCol] ?? ''
        let bv = b[sortCol] ?? ''
        if (typeof av === 'string') av = av.toLowerCase()
        if (typeof bv === 'string') bv = bv.toLowerCase()
        return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
      })
  }, [maps, search, status, department, priority, sortCol, sortDir])

  const hasFilters = search || status || department || priority
  const clear = useCallback(() => { setSearch(''); setStatus(''); setDept(''); setPriority('') }, [])

  const advance = async (m, to, lbl) => {
    setBusyId(m.id)
    try {
      await updateMAPStatus(m.id, to)
      setNotification({ type: 'success', message: `MAP "${lbl.toLowerCase()}" — status updated` })
      await refresh()
    } catch {
      setNotification({ type: 'error', message: 'Could not update status — please retry' })
    } finally {
      setBusyId(null)
    }
  }

  const thProps = { sortCol, sortDir, onSort: toggleSort }

  return (
    <div className="space-y-4">
      {usingMock && (
        <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 text-sm text-amber-800 dark:text-amber-300">
          Backend not reachable — showing representative demo data.
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actions, clauses, or MAP ID…"
            className="w-full rounded-lg border border-line dark:border-gray-700 bg-white dark:bg-gray-900 py-2 pl-8 pr-3 text-sm text-ink dark:text-gray-200 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 dark:focus:ring-primary-700"
          />
        </div>

        <div className="flex items-center gap-1 text-gray-400 dark:text-gray-600">
          <SlidersHorizontal size={12} />
          <span className="font-mono text-[10px] uppercase tracking-wider">Filter</span>
        </div>

        {[
          { label: 'Status',     val: status,     opts: STATUS_OPTIONS,   set: setStatus },
          { label: 'Department', val: department, opts: DEPARTMENTS,      set: setDept   },
          { label: 'Priority',   val: priority,   opts: PRIORITY_OPTIONS, set: setPriority },
        ].map(({ label, val, opts, set }) => (
          <select
            key={label}
            value={val}
            onChange={(e) => set(e.target.value)}
            className="rounded-lg border border-line dark:border-gray-700 bg-white dark:bg-gray-900 py-2 pl-3 pr-7 text-sm text-ink dark:text-gray-200 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
          >
            <option value="">All {label}s</option>
            {opts.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}

        {hasFilters && (
          <button
            onClick={clear}
            className="flex items-center gap-1 rounded-lg border border-line dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <X size={12} /> Clear
          </button>
        )}

        <p className="ml-auto font-mono text-[11px] text-gray-400 dark:text-gray-600">
          {filtered.length} of {maps.length} MAPs
          {expandedId && <span className="text-primary-600 dark:text-primary-400 ml-1">· 1 expanded</span>}
        </p>
      </div>

      {/* ── Enterprise register table ── */}
      <div className="overflow-hidden rounded-xl border border-line dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line dark:border-gray-800 bg-paper/60 dark:bg-gray-900/60">
              <tr>
                <th className="w-6 px-4 py-3" />
                <Th label="ID"                        className="w-20"           {...thProps} />
                <Th label="Regulator"                                            {...thProps} />
                <Th col="action"     label="Action"   className="min-w-[260px]" {...thProps} />
                <Th col="department" label="Dept"                                {...thProps} />
                <Th col="priority"   label="Priority"                            {...thProps} />
                <Th label="Confidence"                                           {...thProps} />
                <Th col="status"     label="Status"                              {...thProps} />
                <Th col="deadline"   label="Deadline"                            {...thProps} />
                <Th label="Advance"                                              {...thProps} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-gray-800">
              {loading ? (
                <SkeletonTableRows rows={6} cols={10} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="font-serif text-base text-gray-500 dark:text-gray-600">No MAPs match these filters.</p>
                      {hasFilters && (
                        <button onClick={clear} className="font-mono text-[11px] text-primary-600 dark:text-primary-400 hover:underline">
                          Clear filters to see all {maps.length} MAPs
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const step = NEXT_STEP[sk(m.status)]
                  const prio = (m.priority || '').toLowerCase()
                  const exp  = expandedId === m.id
                  const circ = circularById[m.circular_id]
                  return (
                    <Fragment key={m.id}>
                      <tr
                        onClick={() => toggleExpand(m.id)}
                        className={`cursor-pointer transition-colors ${
                          exp ? 'bg-primary-50/30 dark:bg-primary-900/10' :
                          prio === 'critical' ? 'hover:bg-danger-50/20 dark:hover:bg-red-900/10' :
                          'hover:bg-paper/60 dark:hover:bg-gray-900/60'
                        }`}
                      >
                        {/* Expand chevron */}
                        <td className="pl-4 pr-1 py-3">
                          <ChevronRight
                            size={13}
                            className={`text-gray-400 transition-transform duration-150 ${exp ? 'rotate-90' : ''}`}
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-gray-400 dark:text-gray-600">
                          {m.id?.slice(0, 8)?.toUpperCase()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {circ ? (
                            <span className="rounded border border-brass/30 dark:border-brass/20 bg-brass-soft dark:bg-brass/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-brass-deep dark:text-brass">
                              {circ.source}
                            </span>
                          ) : (
                            <span className="font-mono text-[11px] text-gray-300 dark:text-gray-700">—</span>
                          )}
                        </td>
                        <td className="max-w-xs px-4 py-3">
                          <p className="line-clamp-2 text-[13px] leading-snug text-ink dark:text-gray-200">{m.action}</p>
                          {m.source_clause && (
                            <p className="mt-0.5 font-mono text-[10px] text-gray-400 dark:text-gray-600">§ {m.source_clause}</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400">
                          {m.department || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={m.priority} />
                        </td>
                        <td className="px-4 py-3 font-mono text-[12px] tabular-nums">
                          {m.confidence_score != null ? (
                            <span className={CONF_CLS(m.confidence_score)}>
                              {Math.round(m.confidence_score * 100)}%
                            </span>
                          ) : <span className="text-gray-300 dark:text-gray-700">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={m.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-gray-600 dark:text-gray-400">
                          {formatDate(m.deadline) || '—'}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {step ? (
                            <button
                              disabled={busyId === m.id}
                              onClick={() => advance(m, step.to, step.label)}
                              className={`whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${step.cls}`}
                            >
                              {busyId === m.id ? 'Saving…' : step.label}
                            </button>
                          ) : sk(m.status) === 'PENDING' ? (
                            <span className="font-mono text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-600">
                              Awaiting review
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-700">—</span>
                          )}
                        </td>
                      </tr>

                      {exp && (
                        <ExpandedRow
                          m={m}
                          circular={circ}
                          onOpenTraceability={setTraceMap}
                        />
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="border-t border-line dark:border-gray-800 px-5 py-2.5">
            <p className="font-mono text-[10px] text-gray-400 dark:text-gray-600">
              Click any row to expand · Click <Brain size={9} className="inline mb-0.5" /> "Why was this generated?" for AI traceability
              · {filtered.length} record{filtered.length !== 1 ? 's' : ''} · Auto-refreshes every 30s
            </p>
          </div>
        )}
      </div>

      {/* Phase 2: Traceability Drawer */}
      {traceMap && (
        <TraceabilityDrawer
          map={traceMap}
          circular={circularById[traceMap.circular_id]}
          onClose={() => setTraceMap(null)}
        />
      )}
    </div>
  )
}
