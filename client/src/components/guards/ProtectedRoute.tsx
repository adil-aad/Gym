import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FullPageSpinner } from '../ui/Spinner'

// Gate for any authenticated route. While the initial /auth/me resolves we
// show a spinner rather than flashing the login page.
export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
