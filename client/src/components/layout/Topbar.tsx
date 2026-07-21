import { useAuth } from '../../context/AuthContext'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export function Topbar() {
  const { user, isOwner, logout } = useAuth()

  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-3 border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-slate-800">{user?.name}</span>
        <Badge tone={isOwner ? 'blue' : 'slate'}>{user?.role}</Badge>
      </div>
      <Button variant="ghost" size="sm" onClick={logout}>
        Log out
      </Button>
    </header>
  )
}
