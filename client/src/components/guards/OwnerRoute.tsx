import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Owner-only routes (payments, revenue). Admins are redirected to the
// dashboard rather than shown a 403 — the sidebar already hides these links.
export function OwnerRoute() {
  const { isOwner } = useAuth()

  if (!isOwner) return <Navigate to="/" replace />

  return <Outlet />
}
