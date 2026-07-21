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

interface SidebarProps {
  /** Whether the mobile drawer is open. Ignored at lg+ where the sidebar is static. */
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { isOwner } = useAuth()
  const items = NAV.filter((item) => !item.ownerOnly || isOwner)

  return (
    <>
      {/* Backdrop — only on mobile while the drawer is open. */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-rail-900 text-slate-300 transition-transform duration-200 lg:static lg:z-auto lg:w-56 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <span className="flex items-baseline gap-2">
            <span className="font-signage text-base text-white">Hammer</span>
            <span className="font-readout text-xs text-cobalt-400">/ ONE</span>
          </span>
          {/* Close button — mobile only. */}
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded p-1 text-slate-500 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <p className="px-5 pb-3 font-signage text-[0.625rem] text-slate-500">Front desk</p>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              // "/" needs `end` so it isn't marked active on every route.
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Cobalt keyline marks the active rail item. */}
                  {isActive && (
                    <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-cobalt-400" />
                  )}
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 font-readout text-[0.625rem] text-slate-600">
          EST. RECORDS · ALWAYS CURRENT
        </div>
      </aside>
    </>
  )
}
