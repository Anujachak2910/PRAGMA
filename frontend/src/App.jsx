/**
 * PRAGMA — Root Application Component
 *
 * Owner: Ashwin (React Dashboard)
 * Milestone: M3 — add full routing and layout here
 *
 * Current state (M0): renders a placeholder landing screen so the
 * frontend boots and confirms Vite + Tailwind are wired correctly.
 */

import { Routes, Route } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'

// TODO (M3): Uncomment as pages are built
// import DashboardLayout from './layouts/DashboardLayout'
// import Dashboard      from './pages/Dashboard'
// import CircularUpload from './pages/CircularUpload'
// import MAPsView       from './pages/MAPsView'
// import ApprovalPanel  from './pages/ApprovalPanel'
// import EventLog       from './pages/EventLog'

function App() {
  return (
    <AppProvider>
      {/* TODO (M3): Replace with <DashboardLayout> and <Routes> */}
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold text-primary-900 tracking-tight">PRAGMA</h1>
          <p className="text-gray-500 text-lg">
            Proactive Regulatory Autonomous Governance &amp; Management Agent
          </p>
          <span className="inline-block mt-4 px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            M0 Foundation — frontend scaffolded ✓
          </span>
        </div>
      </div>
    </AppProvider>
  )
}

export default App
