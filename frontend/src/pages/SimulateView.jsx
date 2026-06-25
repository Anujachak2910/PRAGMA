import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, AlertTriangle, Clock, TrendingUp, Building2,
  ChevronRight, Cpu, CheckCircle2, ArrowRight, BarChart3,
  FileText, ShieldAlert,
} from 'lucide-react'
import api from '../services/api'

const PRIORITY_CFG = {
  Critical: { cls: 'text-danger-700 dark:text-red-400 bg-danger-50 dark:bg-red-900/30 border-danger-200 dark:border-red-800/60',  dot: 'bg-danger' },
  High:     { cls: 'text-warning-700 dark:text-amber-400 bg-warning-50 dark:bg-amber-900/30 border-warning-200 dark:border-amber-800/60', dot: 'bg-warning' },
  Medium:   { cls: 'text-brass-deep dark:text-brass bg-brass-soft/60 dark:bg-brass/10 border-brass/30',                               dot: 'bg-brass' },
  Low:      { cls: 'text-[#8b98aa] bg-paper dark:bg-surface border-line',                                                             dot: 'bg-[#8b98aa]' },
}

const RISK_COLOR = {
  Critical: 'text-danger-700 dark:text-red-400',
  High:     'text-warning-700 dark:text-amber-400',
  Medium:   'text-brass-deep dark:text-brass',
  Low:      'text-success-700 dark:text-green-400',
}

function RiskGauge({ score }) {
  const color =
    score >= 75 ? '#B42318' :
    score >= 50 ? '#B54708' :
    score >= 25 ? '#c69b4f' : '#067647'

  const r = 36, circumference = Math.PI * r
  const filled = (score / 100) * circumference

  return (
    <svg width="96" height="60" viewBox="0 0 96 60" aria-hidden="true">
      <path d="M12,48 A36,36 0 0 1 84,48" fill="none" stroke="rgb(var(--line))" strokeWidth="7" strokeLinecap="round" />
      <path d="M12,48 A36,36 0 0 1 84,48" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      <text x="48" y="46" textAnchor="middle" fontSize="17"
        fontFamily="IBM Plex Serif, serif" fontWeight="700" fill={color}>{score}</text>
    </svg>
  )
}

const SOURCES = ['RBI', 'SEBI', 'MCA', 'Other']

export default function SimulateView() {
  const navigate = useNavigate()
  const [title,    setTitle]    = useState('')
  const [source,   setSource]   = useState('RBI')
  const [content,  setContent]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState(null)

  const canSubmit = title.trim().length > 3 && content.trim().length > 50 && !loading

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await api.post('/simulate', { title, source, content }, { timeout: 120000 })
      setResult(data)
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const handleIngest = () => {
    navigate('/upload', { state: { prefill: { title, source, content } } })
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-brass flex-shrink-0" />
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-brass-deep dark:text-brass">
              Predictive Intelligence
            </p>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-ink dark:text-[#e8edf5]">
            Compliance Impact Simulator
          </h1>
          <p className="mt-1 text-[13px] text-[#8b98aa]">
            Predict the full compliance burden of a regulatory circular before formally ingesting it.
            Departments impacted, effort required, risk exposure, and implementation sequence — instantly.
          </p>
        </div>
        {result && (
          <button
            onClick={handleIngest}
            className="flex-shrink-0 flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 transition-colors"
          >
            Formally Ingest <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Input panel */}
      <div className="rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line bg-paper/40 dark:bg-surface/40 px-5 py-3">
          <FileText size={12} className="text-[#8b98aa]" />
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass-deep dark:text-brass">
            Circular Input
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8b98aa] mb-1.5">
              Circular Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. RBI Master Direction — Digital Lending 2024"
              className="w-full rounded-lg border border-line bg-paper/40 dark:bg-surface px-3.5 py-2.5 text-sm text-ink dark:text-[#e8edf5] placeholder:text-[#8b98aa]/60 focus:outline-none focus:ring-2 focus:ring-brass/40"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8b98aa] mb-1.5">
              Regulatory Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-lg border border-line bg-paper/40 dark:bg-surface px-3.5 py-2.5 text-sm text-ink dark:text-[#e8edf5] focus:outline-none focus:ring-2 focus:ring-brass/40"
            >
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8b98aa] mb-1.5">
              Circular Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              placeholder="Paste the full text of the regulatory circular here…"
              className="w-full rounded-lg border border-line bg-paper/40 dark:bg-surface px-3.5 py-2.5 text-sm text-ink dark:text-[#e8edf5] placeholder:text-[#8b98aa]/60 focus:outline-none focus:ring-2 focus:ring-brass/40 resize-y font-mono leading-relaxed"
            />
            <p className="mt-1 font-mono text-[10px] text-[#8b98aa]">
              {content.length} characters · Minimum 50 required
            </p>
          </div>
        </div>
        <div className="border-t border-line px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Cpu size={11} className="text-violet-500" />
            <span className="font-mono text-[10px] text-[#8b98aa]">
              Powered by Local AI Engine — no data leaves your network
            </span>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!canSubmit}
            className="flex items-center gap-2 rounded-lg bg-brass px-5 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-white transition-all hover:bg-brass-deep disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Zap size={12} />
                Analyze Impact
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-danger-200 dark:border-red-800/60 bg-danger-50 dark:bg-red-900/20 px-5 py-4">
          <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-danger-700">Analysis Failed</p>
            <p className="mt-0.5 text-[13px] text-[#8b98aa]">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fadeIn">
          {/* Summary banner */}
          <div className={`rounded-xl border px-5 py-4 ${
            result.risk_level === 'Critical' ? 'border-danger-200 dark:border-red-800/60 bg-danger-50 dark:bg-red-900/10' :
            result.risk_level === 'High'     ? 'border-warning-200 dark:border-amber-800/60 bg-warning-50 dark:bg-amber-900/10' :
            'border-line bg-paper/60 dark:bg-surface/40'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={13} className={RISK_COLOR[result.risk_level]} />
              <span className={`font-mono text-[9px] font-bold uppercase tracking-widest ${RISK_COLOR[result.risk_level]}`}>
                Impact Assessment Complete
              </span>
              <span className="ml-auto font-mono text-[10px] text-[#8b98aa]">
                Engine: {result.engine_used === 'ollama' ? '🧠 Local AI (Ollama)' : '📋 Rule-Based'}
              </span>
            </div>
            <p className="text-[13px] text-ink dark:text-[#e8edf5]/90 leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Risk score */}
            <div className="rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
              <div className="border-b border-line bg-paper/40 dark:bg-surface/40 px-4 py-2">
                <p className="font-mono text-[9px] uppercase tracking-wider text-[#8b98aa]">Risk Score</p>
              </div>
              <div className="flex items-center justify-center py-2">
                <RiskGauge score={result.risk_score} />
              </div>
              <div className="border-t border-line px-4 py-2 text-center">
                <span className={`font-mono text-[10px] font-bold uppercase tracking-wider ${RISK_COLOR[result.risk_level]}`}>
                  {result.risk_level} Risk
                </span>
              </div>
            </div>

            {/* MAPs extracted */}
            <div className="rounded-xl border border-line bg-white dark:bg-card px-4 py-4">
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#8b98aa]">Obligations</p>
              <p className="mt-2 font-serif text-4xl font-semibold tabular-nums text-ink dark:text-[#e8edf5]">
                {result.extracted_maps.length}
              </p>
              <p className="mt-1 text-[11px] text-[#8b98aa]">MAPs extracted</p>
            </div>

            {/* Effort */}
            <div className="rounded-xl border border-line bg-white dark:bg-card px-4 py-4">
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#8b98aa]">Total Effort</p>
              <p className="mt-2 font-serif text-4xl font-semibold tabular-nums text-ink dark:text-[#e8edf5]">
                {result.effort_summary.total_effort_weeks}
              </p>
              <p className="mt-1 text-[11px] text-[#8b98aa]">person-weeks</p>
            </div>

            {/* Completion */}
            <div className="rounded-xl border border-line bg-white dark:bg-card px-4 py-4">
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#8b98aa]">Est. Completion</p>
              <p className="mt-2 font-serif text-xl font-semibold text-ink dark:text-[#e8edf5] leading-snug">
                {new Date(result.estimated_completion).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="mt-1 text-[11px] text-[#8b98aa]">
                {result.effort_summary.parallel_duration_weeks}w parallel execution
              </p>
            </div>
          </div>

          {/* Dept heatmap + implementation sequence */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Affected departments */}
            <div className="rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-line bg-paper/40 dark:bg-surface/40 px-5 py-3">
                <Building2 size={12} className="text-[#8b98aa]" />
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass-deep dark:text-brass">
                  Departments Impacted
                </p>
                <span className="ml-auto font-mono text-[10px] text-[#8b98aa]">
                  {result.affected_departments.length} dept{result.affected_departments.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-line">
                {result.affected_departments.map((d) => {
                  const riskPct = Math.min(100, (d.risk_points / 30) * 100)
                  const barColor =
                    riskPct >= 66 ? 'bg-danger' :
                    riskPct >= 33 ? 'bg-warning' : 'bg-brass'
                  return (
                    <div key={d.department} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-ink dark:text-[#e8edf5]">
                            {d.department}
                          </span>
                          <span className="font-mono text-[10px] text-[#8b98aa]">
                            {d.map_count} MAP{d.map_count !== 1 ? 's' : ''}
                          </span>
                          {d.critical > 0 && (
                            <span className="rounded bg-danger-50 dark:bg-red-900/30 px-1 py-0.5 font-mono text-[9px] font-bold text-danger dark:text-red-400">
                              {d.critical} critical
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-[#8b98aa]">
                          {d.effort_weeks}w effort
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-line dark:bg-surface overflow-hidden">
                        <div className={`h-full rounded-full ${barColor} transition-all duration-700`}
                          style={{ width: `${Math.max(riskPct, 4)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Implementation sequence */}
            <div className="rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-line bg-paper/40 dark:bg-surface/40 px-5 py-3">
                <BarChart3 size={12} className="text-[#8b98aa]" />
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass-deep dark:text-brass">
                  Recommended Sequence
                </p>
              </div>
              <div className="divide-y divide-line max-h-80 overflow-y-auto">
                {result.implementation_sequence.map((s) => {
                  const cfg = PRIORITY_CFG[s.priority] || PRIORITY_CFG.Medium
                  return (
                    <div key={s.step} className="flex items-start gap-3 px-5 py-3">
                      <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-line dark:bg-surface font-mono text-[10px] font-bold text-[#8b98aa]">
                        {s.step}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${cfg.cls}`}>
                            {s.priority}
                          </span>
                          <span className="font-mono text-[9px] text-[#8b98aa]">{s.department}</span>
                          {s.deadline && (
                            <span className="flex items-center gap-1 font-mono text-[9px] text-[#8b98aa]">
                              <Clock size={8} />
                              {new Date(s.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-ink dark:text-[#e8edf5] leading-snug line-clamp-2">
                          {s.action}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Overlap analysis */}
          {result.overlap_analysis.overlaps_found > 0 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/10 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-900/20 px-5 py-3">
                <AlertTriangle size={12} className="text-warning flex-shrink-0" />
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-warning-700 dark:text-amber-400">
                  {result.overlap_analysis.overlaps_found} Potential Overlap{result.overlap_analysis.overlaps_found !== 1 ? 's' : ''} with Existing MAPs
                </p>
              </div>
              <div className="divide-y divide-amber-200 dark:divide-amber-800/40">
                {result.overlap_analysis.details.map((o, i) => (
                  <div key={i} className="px-5 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[9px] font-bold text-warning-700 dark:text-amber-400">
                        {o.overlap_score}% match
                      </span>
                      <span className="font-mono text-[9px] text-[#8b98aa]">{o.department}</span>
                      <span className="rounded border border-amber-300 dark:border-amber-700 px-1.5 py-0.5 font-mono text-[9px] text-warning-700 dark:text-amber-400">
                        {o.existing_status}
                      </span>
                    </div>
                    <p className="text-[12px] text-ink dark:text-[#e8edf5]/90">
                      Existing: {o.existing_action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ingest CTA */}
          <div className="flex items-center justify-between rounded-xl border border-line bg-paper/60 dark:bg-surface/40 px-5 py-4">
            <div>
              <p className="text-[13px] font-semibold text-ink dark:text-[#e8edf5]">
                Ready to formally ingest this circular?
              </p>
              <p className="mt-0.5 text-[12px] text-[#8b98aa]">
                This will extract MAPs, create the approval workflow, and log to the audit ledger.
              </p>
            </div>
            <button
              onClick={handleIngest}
              className="flex-shrink-0 flex items-center gap-2 rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 transition-colors"
            >
              Ingest Circular <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
