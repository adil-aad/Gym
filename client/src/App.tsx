import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/guards/ProtectedRoute'
import { OwnerRoute } from './components/guards/OwnerRoute'
import { AppLayout } from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import PlansPage from './pages/plans/PlansPage'
import MembersPage from './pages/members/MembersPage'
import MemberDetailPage from './pages/members/MemberDetailPage'
import DashboardPage from './pages/DashboardPage'
import PaymentsPage from './pages/payments/PaymentsPage'
import RevenuePage from './pages/payments/RevenuePage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/members/:id" element={<MemberDetailPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Owner-only section */}
          <Route element={<OwnerRoute />}>
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/revenue" element={<RevenuePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
