import { useAuth } from '../../context/AuthContext'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, isOwner, logout } = useAuth()

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Hamburger — mobile only. */}
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="-ml-1 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="ml-auto flex items-center gap-2.5 text-sm">
        <span className="hidden font-medium text-slate-800 sm:inline">{user?.name}</span>
        <Badge tone={isOwner ? 'blue' : 'slate'}>{user?.role}</Badge>
      </div>
      <Button variant="ghost" size="sm" onClick={logout}>
        Log out
      </Button>
    </header>
  )
}
