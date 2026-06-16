import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/':          'Dashboard',
  '/maps':      'Measurable Action Points',
  '/approvals': 'Approval Panel',
  '/events':    'Event Log',
  '/upload':    'Upload Circular',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'PRAGMA'

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
        Backend: localhost:8000
      </div>
    </header>
  )
}
