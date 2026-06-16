/**
 * PRAGMA — Toast
 * Owner: Ashwin — M3
 * Reads notification from AppContext, auto-dismisses after 3s.
 * Set one anywhere with: setNotification({ type: "success"|"error", message })
 */

import { useEffect } from 'react'
import { useAppContext } from '../../contexts/AppContext'

const STYLES = {
  success: 'bg-green-600',
  error: 'bg-red-600',
}

export default function Toast() {
  const { notification, setNotification } = useAppContext()

  useEffect(() => {
    if (!notification) return
    const id = setTimeout(() => setNotification(null), 3000)
    return () => clearTimeout(id)
  }, [notification, setNotification])

  if (!notification) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg ${STYLES[notification.type] || STYLES.success}`}>
        {notification.message}
      </div>
    </div>
  )
}
