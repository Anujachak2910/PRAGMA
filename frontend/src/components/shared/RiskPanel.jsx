import { ShieldAlert, AlertTriangle, Briefcase, ClipboardCheck } from 'lucide-react'

const LEVEL_CFG = {
  Critical: { cls: 'bg-danger-50 dark:bg-red-900/30 border-danger-200 dark:border-red-800 text-danger-700 dark:text-red-400', bar: 'bg-danger' },
  High:     { cls: 'bg-warning-50 dark:bg-amber-900/30 border-warning-200 dark:border-amber-800 text-warning-700 dark:text-amber-400', bar: 'bg-warning' },
  Medium:   { cls: 'bg-brass-soft dark:bg-brass/10 border-brass/40 dark:border-brass/30 text-brass-deep dark:text-brass', bar: 'bg-brass' },
  Low:      { cls: 'bg-success-50 dark:bg-green-900/30 border-success-200 dark:border-green-800 text-success-700 dark:text-green-400', bar: 'bg-success' },
}

const RISK_ITEMS = [
  { key: 'operational', label: 'Operational Risk',  icon: ShieldAlert  },
  { key: 'regulatory',  label: 'Regulatory Risk',   icon: AlertTriangle },
  { key: 'business',    label: 'Business Impact',   icon: Briefcase    },
  { key: 'inspection',  label: 'Inspection Risk',   icon: ClipboardCheck },
]

function ScoreGauge({ score, level }) {
  const cfg = LEVEL_CFG[level] || LEVEL_CFG.Medium
  const angle = (score / 100) * 180   // 0–180 degrees for half-circle
  const radius = 36
  const circumference = Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <div className="flex items-center gap-4">
      {/* SVG semi-circle gauge */}
      <div className="relative flex-shrink-0">
        <svg width="88" height="50" viewBox="0 0 88 50">
          <path
            d="M 8 46 A 36 36 0 0 1 80 46"
            fill="none"
            strokeWidth="7"
            stroke="currentColor"
            className="text-gray-100 dark:text-gray-800"
          />
          <path
            d="M 8 46 A 36 36 0 0 1 80 46"
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${dashOffset}`}
            stroke="currentColor"
            className={score >= 76 ? 'text-danger' : score >= 51 ? 'text-warning' : score >= 26 ? 'text-brass' : 'text-success'}
            style={{ transform: 'rotate(0)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-0.5">
          <span className="font-mono text-sm font-bold tabular-nums text-ink dark:text-gray-100">
            {score}
          </span>
        </div>
      </div>

      {/* Level badge + score bar */}
      <div className="flex-1 min-w-0">
        <div className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider mb-2 ${cfg.cls}`}>
          {level} Risk
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="mt-1 font-mono text-[9px] text-gray-400 dark:text-gray-600">
          Risk Score: {score}/100
        </p>
      </div>
    </div>
  )
}

export default function RiskPanel({ map }) {
  if (!map?.risk) return null
  const { risk } = map
  const cfg = LEVEL_CFG[risk.level] || LEVEL_CFG.Medium

  return (
    <div className="mt-4 rounded-lg border border-line dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-line dark:border-gray-800 bg-paper/40 dark:bg-gray-900/40 px-4 py-2.5">
        <ShieldAlert size={12} className="text-danger dark:text-red-400 flex-shrink-0" />
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500 dark:text-gray-500">
          Compliance Risk Simulator — Risk if Ignored
        </p>
      </div>

      <div className="p-4 space-y-4 bg-white dark:bg-gray-950">
        {/* Score gauge */}
        <ScoreGauge score={risk.score} level={risk.level} />

        {/* Risk grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RISK_ITEMS.map(({ key, label, icon: Icon }) => (
            risk[key] ? (
              <div
                key={key}
                className="rounded-md border border-line dark:border-gray-800 p-3"
              >
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Icon size={11} className="text-gray-400 dark:text-gray-600 flex-shrink-0" />
                  <p className="font-mono text-[9px] uppercase tracking-wider text-gray-400 dark:text-gray-600">
                    {label}
                  </p>
                </div>
                <p className="text-[11.5px] leading-relaxed text-gray-600 dark:text-gray-400">
                  {risk[key]}
                </p>
              </div>
            ) : null
          ))}
        </div>
      </div>
    </div>
  )
}
