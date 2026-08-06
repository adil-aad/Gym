import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useExpiringMembers, useMemberStats } from '../hooks/useMembers'
import { useRevenue } from '../hooks/usePayments'
import {
  formatCurrency,
  formatDate,
  daysUntil,
  monthName,
  paymentMethodLabel,
} from '../lib/format'
import type { MemberStats, RevenueAnalytics } from '../types'

// Meter hue — matches RevenuePage (dataviz palette slot 1), ≥3:1 on white.
const SERIES = '#2a78d6'

function StatTile({
  label,
  value,
  loading,
  to,
  hint,
}: {
  label: string
  value: React.ReactNode
  loading?: boolean
  to?: string
  hint?: React.ReactNode
}) {
  const body = (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white px-5 py-5">
      {/* Cobalt keyline — the scoreboard tally mark. */}
      <span className="absolute inset-y-0 left-0 w-1 bg-cobalt-500" />
      <p className="font-signage text-[0.625rem] text-slate-500">{label}</p>
      <p className="mt-3 font-readout text-3xl font-medium text-slate-900">
        {loading ? <Spinner className="h-6 w-6" /> : value}
      </p>
      {hint && !loading && <div className="mt-1.5 text-xs">{hint}</div>}
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

/** Signed change vs the previous month, colored by direction. */
function DeltaHint({
  delta,
  format = (n: number) => n.toLocaleString(),
}: {
  delta: number
  format?: (n: number) => string
}) {
  if (delta === 0) {
    return <span className="text-slate-400">same as last month</span>
  }
  const up = delta > 0
  return (
    <span className={up ? 'text-green-600' : 'text-red-600'}>
      {up ? '▲' : '▼'} {format(Math.abs(delta))} vs last month
    </span>
  )
}

const STATUS_SEGMENTS = [
  { key: 'active', label: 'Active', swatch: 'bg-green-500' },
  { key: 'expired', label: 'Expired', swatch: 'bg-red-400' },
  { key: 'suspended', label: 'Suspended', swatch: 'bg-slate-300' },
] as const

/** Proportion bar + legend for the roster's status split. */
function StatusBreakdown({ stats }: { stats: MemberStats }) {
  const { total, byStatus } = stats
  if (total === 0) {
    return <p className="text-sm text-slate-500">No members yet.</p>
  }
  return (
    <>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        {STATUS_SEGMENTS.filter((s) => byStatus[s.key] > 0).map((s) => (
          <div
            key={s.key}
            className={s.swatch}
            style={{ width: `${(byStatus[s.key] / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-3">
        {STATUS_SEGMENTS.map((s) => (
          <li key={s.key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-700">
              <span className={`h-2.5 w-2.5 rounded-full ${s.swatch}`} />
              {s.label}
            </span>
            <span
              className="font-readout font-medium text-slate-900"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {byStatus[s.key].toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {total.toLocaleString()} member{total === 1 ? '' : 's'} total
      </p>
    </>
  )
}

/** Current-month revenue with month-over-month delta and yearly context. */
function MonthRevenue({ data }: { data: RevenueAnalytics }) {
  const month = new Date().getMonth() + 1 // 1-indexed, matches server $month
  const rev = (m: number) =>
    data.monthlyBreakdown.find((b) => b.month === m)?.revenue ?? 0
  const thisMonth = rev(month)
  // January's "last month" lives in the previous year's dataset — no delta.
  const lastMonth = month > 1 ? rev(month - 1) : null

  return (
    <>
      <p className="font-readout text-3xl font-medium text-slate-900">
        {formatCurrency(thisMonth)}
      </p>
      {lastMonth !== null && (
        <p className="mt-1.5 text-xs">
          <DeltaHint
            delta={thisMonth - lastMonth}
            format={(n) => formatCurrency(n)}
          />
        </p>
      )}
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {formatCurrency(data.yearRevenue)} this year ·{' '}
        {formatCurrency(data.totalRevenue)} all-time
      </p>
    </>
  )
}

/** Meter list of revenue per payment method (mirrors RevenuePage). */
function MethodMix({ data }: { data: RevenueAnalytics }) {
  if (data.byPaymentMethod.length === 0) {
    return <p className="text-sm text-slate-500">No payments yet.</p>
  }
  const max = Math.max(1, ...data.byPaymentMethod.map((m) => m.revenue))
  return (
    <ul className="space-y-4">
      {[...data.byPaymentMethod]
        .sort((a, b) => b.revenue - a.revenue)
        .map((m) => (
          <li key={m.method}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="text-slate-700">
                {paymentMethodLabel(m.method)}
                <span className="ml-1.5 text-xs text-slate-400">
                  {m.payments} payment{m.payments === 1 ? '' : 's'}
                </span>
              </span>
              <span
                className="font-medium text-slate-900"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatCurrency(m.revenue)}
              </span>
            </div>
            {/* Meter: unfilled track is a lighter step of the same hue */}
            <div className="h-2 rounded-full bg-[#cde2fb]">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${Math.max(2, (m.revenue / max) * 100)}%`,
                  backgroundColor: SERIES,
                }}
              />
            </div>
          </li>
        ))}
    </ul>
  )
}

export default function DashboardPage() {
  const { user, isOwner } = useAuth()
  const year = new Date().getFullYear()

  // One aggregate call covers the status tiles and the breakdown card.
  const stats = useMemberStats()
  // Tile counts the 3-day horizon; the list drills into the next 24 hours.
  const expiring3 = useExpiringMembers(3)
  const expiringSoon = useExpiringMembers(1)
  // Admins get a 401 on this endpoint — never fire it for them.
  const revenue = useRevenue(year, isOwner)

  const newDelta =
    (stats.data?.newThisMonth ?? 0) - (stats.data?.newLastMonth ?? 0)

  return (
    <>
      <PageHeader
        title="The Floor"
        description={`Welcome back, ${user?.name ?? ''}. Here's where the gym stands today.`}
      />

      <div
        className={`mb-6 grid gap-4 ${isOwner ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}
      >
        <StatTile
          label="Active members"
          value={stats.data?.byStatus.active ?? 0}
          loading={stats.isLoading}
          to="/members"
        />
        <StatTile
          label="New this month"
          value={stats.data?.newThisMonth ?? 0}
          loading={stats.isLoading}
          hint={stats.data ? <DeltaHint delta={newDelta} /> : undefined}
          to="/members"
        />
        <StatTile
          label="Expiring in 3 days"
          value={expiring3.data?.length ?? 0}
          loading={expiring3.isLoading}
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

      <div className="mb-6 grid items-start gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="Membership"
            subtitle="Where the roster stands by status."
          />
          <CardBody>
            {stats.isLoading ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : stats.data ? (
              <StatusBreakdown stats={stats.data} />
            ) : null}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
        <CardHeader
          title="Expiring soon"
          subtitle="Active memberships ending within the next 24 hours — follow up for renewals."
        />
        {expiringSoon.isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !expiringSoon.data || expiringSoon.data.length === 0 ? (
          <EmptyState
            title="Nothing expiring today"
            description="No active memberships end in the next 24 hours."
          />
        ) : (
          <>
          {/* Mobile: card list. */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {expiringSoon.data.map((m) => {
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
              {expiringSoon.data.map((m) => {
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
      </div>

      {/* Owner-only: revenue snapshot from the already-fetched analytics. */}
      {isOwner && !revenue.isLoading && revenue.data && (
        <div className="grid items-start gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader
              title={`Revenue — ${monthName(new Date().getMonth() + 1)}`}
              subtitle="Collected so far this month."
            />
            <CardBody>
              <MonthRevenue data={revenue.data} />
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title="By payment method"
              subtitle={`Where ${year} revenue came from.`}
            />
            <CardBody>
              <MethodMix data={revenue.data} />
            </CardBody>
          </Card>
        </div>
      )}
    </>
  )
}
