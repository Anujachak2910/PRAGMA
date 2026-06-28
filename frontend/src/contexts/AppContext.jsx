import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [activeCircularId, setActiveCircularId] = useState(null)
  const [notification, setNotification]         = useState(null) // { type, message }
  const [demoScenario, setDemoScenario]         = useState('rbi-cyber')

  const value = {
    activeCircularId, setActiveCircularId,
    notification,     setNotification,
    demoScenario,     setDemoScenario,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider')
  return ctx
}
