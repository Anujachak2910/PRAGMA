import { useEffect } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { useAppContext } from '../../contexts/AppContext'

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle2,
    wrap: 'border-success-200 dark:border-green-800/60 bg-success-50 dark:bg-green-900/20',
    iconCls: 'text-success-700 dark:text-green-400',
    textCls: 'text-success-700 dark:text-green-300',
  },
  error: {
    icon: AlertTriangle,
    wrap: 'border-danger-200 dark:border-red-800/60 bg-danger-50 dark:bg-red-900/20',
    iconCls: 'text-danger-700 dark:text-red-400',
    textCls: 'text-danger-700 dark:text-red-300',
  },
  warning: {
    icon: AlertTriangle,
    wrap: 'border-warning-200 dark:border-amber-800/60 bg-warning-50 dark:bg-amber-900/20',
    iconCls: 'text-warning-700 dark:text-amber-400',
    textCls: 'text-warning-700 dark:text-amber-300',
  },
  info: {
    icon: Info,
    wrap: 'border-primary-200 dark:border-primary-800/60 bg-primary-50 dark:bg-primary-900/20',
    iconCls: 'text-primary-600 dark:text-primary-400',
    textCls: 'text-primary-700 dark:text-primary-300',
  },
}

export default function Toast() {
  const { notification, setNotification } = useAppContext()

  useEffect(() => {
    if (!notification) return
    const id = setTimeout(() => setNotification(null), 4000)
    return () => clearTimeout(id)
  }, [notification, setNotification])

  if (!notification) return null

  const cfg = TOAST_CONFIG[notification.type] || TOAST_CONFIG.success
  const Icon = cfg.icon

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 animate-slideIn"
    >
      <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg max-w-sm ${cfg.wrap}`}>
        <Icon size={16} className={`flex-shrink-0 mt-0.5 ${cfg.iconCls}`} strokeWidth={2} />
        <p className={`flex-1 text-sm font-medium leading-snug ${cfg.textCls}`}>
          {notification.message}
        </p>
        <button
          onClick={() => setNotification(null)}
          aria-label="Dismiss notification"
          className={`flex-shrink-0 rounded p-0.5 opacity-50 hover:opacity-100 transition-opacity ${cfg.iconCls}`}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
