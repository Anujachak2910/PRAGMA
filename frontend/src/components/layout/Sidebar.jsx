import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, CheckSquare, ScrollText, Upload } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard',       icon: LayoutDashboard, end: true },
  { to: '/maps',      label: 'MAPs',            icon: FileText },
  { to: '/approvals', label: 'Approvals',       icon: CheckSquare },
  { to: '/events',    label: 'Event Log',       icon: ScrollText },
  { to: '/upload',    label: 'Upload Circular', icon: Upload },
]

export default function Sidebar() {
  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-5">
        <h1 className="text-2xl font-bold tracking-tight text-primary-900">PRAGMA</h1>
        <p className="mt-1 text-xs text-gray-400">Regulatory Compliance Agent</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              ].join(' ')
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 px-6 py-4">
        <p className="text-xs text-gray-400">SuRaksha Cyber Hackathon 2.0</p>
      </div>
    </aside>
  )
}
