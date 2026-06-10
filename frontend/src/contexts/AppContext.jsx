/**
 * PRAGMA — Global Application Context
 *
 * Owner: Ashwin (React Dashboard)
 * Milestone: M3 — expand state as pages are built
 *
 * Holds lightweight global state:
 *   - Which circular is currently active (for drill-down views)
 *   - Notification banner state (success / error toasts)
 */

import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [activeCircularId, setActiveCircularId] = useState(null)
  const [notification, setNotification] = useState(null) // { type, message }

  const value = {
    activeCircularId,
    setActiveCircularId,
    notification,
    setNotification,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider')
  return ctx
}
