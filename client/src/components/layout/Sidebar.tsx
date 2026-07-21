import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface NavItem {
  to: string
  label: string
  ownerOnly?: boolean
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/members', label: 'Members' },
  { to: '/plans', label: 'Plans' },
  { to: '/payments', label: 'Payments', ownerOnly: true },
  { to: '/revenue', label: 'Revenue', ownerOnly: true },
  { to: '/settings', label: 'Settings' },
]

export function Sidebar() {
  const { isOwner } = useAuth()
  const items = NAV.filter((item) => !item.ownerOnly || isOwner)

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="px-5 py-5">
        <span className="text-lg font-semibold text-slate-900">Gym Manager</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            // "/" needs `end` so it isn't marked active on every route.
            end={item.to === '/'}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
