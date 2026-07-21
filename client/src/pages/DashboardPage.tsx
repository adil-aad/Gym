import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useExpiringMembers } from '../hooks/useMembers'
import { useRevenue } from '../hooks/usePayments'
import { membersApi } from '../api/members'
import { queryKeys } from '../lib/queryKeys'
import { formatCurrency, formatDate, daysUntil } from '../lib/format'

function StatTile({
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
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white px-5 py-5">
      {/* Cobalt keyline — the scoreboard tally mark. */}
      <span className="absolute inset-y-0 left-0 w-1 bg-cobalt-500" />
      <p className="font-signage text-[0.625rem] text-slate-500">{label}</p>
      <p className="mt-3 font-readout text-3xl font-medium text-slate-900">
        {loading ? <Spinner className="h-6 w-6" /> : value}
      </p>
    </div>
  )
  return to ? (
    <Link
      to={to}
      className="block transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-1"
    >
      {body}
    </Link>
  ) : (
    body
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
        title="The Floor"
        description={`Welcome back, ${user?.name ?? ''}. Here's where the gym stands today.`}
      />

      <div
        className={`mb-6 grid gap-4 ${isOwner ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
      >
        <StatTile
          label="Active members"
          value={activeCount.data?.total ?? 0}
          loading={activeCount.isLoading}
          to="/members"
        />
        <StatTile
          label="Expiring in 7 days"
          value={expiring.data?.length ?? 0}
          loading={expiring.isLoading}
        />
        {isOwner && (
          <StatTile
            label={`Revenue ${year}`}
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
          <>
          {/* Mobile: card list. */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {expiring.data.map((m) => {
              const days = daysUntil(m.expiryDate)
              return (
                <li key={m._id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/members/${m._id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {m.fullName}
                      </Link>
                      <p className="text-xs text-slate-500">{m.phone}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {m.currentPlan?.title ?? '—'} · expires {formatDate(m.expiryDate)}
                      </p>
                    </div>
                    <Badge tone={days <= 2 ? 'red' : 'amber'}>
                      {days} day{days === 1 ? '' : 's'}
                    </Badge>
                  </div>
                </li>
              )
            })}
          </ul>

          {/* Desktop: table. */}
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-slate-100 text-left font-signage text-[0.625rem] text-slate-500">
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Expires</th>
                <th className="px-5 py-3">Days left</th>
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
          </>
        )}
      </Card>
    </>
  )
}
