import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { EmptyState } from '../../components/ui/EmptyState'
import { usePayments } from '../../hooks/usePayments'
import {
  formatCurrency,
  formatDate,
  paymentMethodLabel,
} from '../../lib/format'
import type { Payment } from '../../types'

/** Member/plan come populated from the list endpoint, but stay defensive. */
function memberOf(p: Payment) {
  return typeof p.member === 'string' ? null : p.member
}
function planOf(p: Payment) {
  return typeof p.plan === 'string' ? null : p.plan
}

export default function PaymentsPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const query = useMemo(
    () => ({
      from: from || undefined,
      to: to || undefined,
      page,
      limit: 20,
    }),
    [from, to, page],
  )

  const { data, isLoading, isError, error, isPlaceholderData } =
    usePayments(query)

  const payments = data?.data ?? []
  const totalPages = data?.pages ?? 1

  // Reset to page 1 whenever a filter changes.
  const onFilterChange = (fn: () => void) => {
    setPage(1)
    fn()
  }

  return (
    <>
      <PageHeader
        title="Payments"
        description="Every payment recorded at your gym."
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Input
            type="date"
            label="From"
            value={from}
            onChange={(e) => onFilterChange(() => setFrom(e.target.value))}
          />
        </div>
        <div className="w-44">
          <Input
            type="date"
            label="To"
            value={to}
            onChange={(e) => onFilterChange(() => setTo(e.target.value))}
          />
        </div>
        {(from || to) && (
          <Button
            variant="secondary"
            size="sm"
            className="mb-0.5"
            onClick={() =>
              onFilterChange(() => {
                setFrom('')
                setTo('')
              })
            }
          >
            Clear
          </Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : isError ? (
          <div className="p-5">
            <ErrorMessage message={error?.message} />
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            title="No payments found"
            description="Try widening the date range, or record a payment from a member's page."
          />
        ) : (
          <table
            className={`w-full text-sm ${isPlaceholderData ? 'opacity-60' : ''}`}
          >
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Member</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Processed by</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const member = memberOf(p)
                return (
                  <tr
                    key={p._id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3 text-slate-700">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="px-5 py-3">
                      {member ? (
                        <Link
                          to={`/members/${member._id}`}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          {member.fullName}
                        </Link>
                      ) : (
                        '—'
                      )}
                      {member?.phone && (
                        <div className="text-xs text-slate-500">
                          {member.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {planOf(p)?.title ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone="slate">
                        {paymentMethodLabel(p.paymentMethod)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {p.processedBy?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-900">
                      {formatCurrency(p.amount)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {data?.page} of {totalPages} · {data?.total} total
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
