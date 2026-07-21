import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useExpiringMembers } from '../hooks/useMembers'
import { useRevenue } from '../hooks/usePayments'
import { membersApi } from '../api/members'
import { queryKeys } from '../lib/queryKeys'
import { formatCurrency, formatDate, daysUntil } from '../lib/format'

function StatCard({
  label,
  value,
  loading,
  to,
}: {
  label: string
  value: React.ReactNode
  loading?: boolean
  to?: string
}) {
  const body = (
    <CardBody>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">
        {loading ? <Spinner className="h-5 w-5" /> : value}
      </p>
    </CardBody>
  )
  return (
    <Card className={to ? 'transition-shadow hover:shadow-md' : ''}>
      {to ? <Link to={to}>{body}</Link> : body}
    </Card>
  )
}

export default function DashboardPage() {
  const { user, isOwner } = useAuth()
  const year = new Date().getFullYear()

  // Cheap count query — we only need `total`, so limit=1.
  const activeCount = useQuery({
    queryKey: queryKeys.membersList({ status: 'active', limit: 1, page: 1 }),
    queryFn: () => membersApi.list({ status: 'active', limit: 1, page: 1 }),
  })

  const expiring = useExpiringMembers(7)
  // Admins get a 401 on this endpoint — never fire it for them.
  const revenue = useRevenue(year, isOwner)

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name ?? ''}`}
        description="Here's what's happening at your gym."
      />

      <div
        className={`mb-6 grid gap-4 ${isOwner ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
      >
        <StatCard
          label="Active members"
          value={activeCount.data?.total ?? 0}
          loading={activeCount.isLoading}
          to="/members"
        />
        <StatCard
          label="Expiring in 7 days"
          value={expiring.data?.length ?? 0}
          loading={expiring.isLoading}
        />
        {isOwner && (
          <StatCard
            label={`Revenue (${year})`}
            value={formatCurrency(revenue.data?.yearRevenue)}
            loading={revenue.isLoading}
            to="/revenue"
          />
        )}
      </div>

      <Card>
        <CardHeader
          title="Expiring soon"
          subtitle="Active memberships ending within 7 days — follow up for renewals."
        />
        {expiring.isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !expiring.data || expiring.data.length === 0 ? (
          <EmptyState
            title="Nothing expiring this week"
            description="All active memberships run beyond the next 7 days."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Member</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Expires</th>
                <th className="px-5 py-3 font-medium">Days left</th>
              </tr>
            </thead>
            <tbody>
              {expiring.data.map((m) => {
                const days = daysUntil(m.expiryDate)
                return (
                  <tr
                    key={m._id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <Link
                        to={`/members/${m._id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {m.fullName}
                      </Link>
                      <div className="text-xs text-slate-500">{m.phone}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {m.currentPlan?.title ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {formatDate(m.expiryDate)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={days <= 2 ? 'red' : 'amber'}>
                        {days} day{days === 1 ? '' : 's'}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </>
  )
}
