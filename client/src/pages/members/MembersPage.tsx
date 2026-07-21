import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge, statusTone } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { EmptyState } from '../../components/ui/EmptyState'
import { useDebounce } from '../../hooks/useDebounce'
import { useMembers, useCreateMember } from '../../hooks/useMembers'
import { usePlans } from '../../hooks/usePlans'
import { formatDate } from '../../lib/format'
import type { MemberInput, MemberStatus } from '../../types'
import { MemberForm } from './MemberForm'

const STATUS_OPTIONS: Array<{ value: '' | MemberStatus; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'suspended', label: 'Suspended' },
]

export default function MembersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'' | MemberStatus>('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)

  const debouncedSearch = useDebounce(search)

  const query = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status: status || undefined,
      page,
      limit: 20,
    }),
    [debouncedSearch, status, page],
  )

  const { data, isLoading, isError, error, isPlaceholderData } = useMembers(query)
  const { data: plans } = usePlans(false)
  const createMember = useCreateMember()

  const members = data?.data ?? []
  const totalPages = data?.pages ?? 1

  const handleCreate = (input: MemberInput) => {
    createMember.mutate(input, { onSuccess: () => setFormOpen(false) })
  }

  // Reset to page 1 whenever a filter changes.
  const onFilterChange = (fn: () => void) => {
    setPage(1)
    fn()
  }

  return (
    <>
      <PageHeader
        title="Members"
        description="Everyone enrolled at your gym."
        action={
          <Button
            onClick={() => {
              createMember.reset()
              setFormOpen(true)
            }}
          >
            Add member
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-64">
          <Input
            placeholder="Search name or phone…"
            value={search}
            onChange={(e) => onFilterChange(() => setSearch(e.target.value))}
            aria-label="Search members"
          />
        </div>
        <div className="w-44">
          <Select
            value={status}
            onChange={(e) =>
              onFilterChange(() => setStatus(e.target.value as '' | MemberStatus))
            }
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
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
        ) : members.length === 0 ? (
          <EmptyState
            title="No members found"
            description="Try adjusting your search or filters, or add a new member."
          />
        ) : (
          <table
            className={`w-full text-sm ${isPlaceholderData ? 'opacity-60' : ''}`}
          >
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Expires</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr
                  key={m._id}
                  onClick={() => navigate(`/members/${m._id}`)}
                  className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {m.fullName}
                  </td>
                  <td className="px-5 py-3 text-slate-700">{m.phone}</td>
                  <td className="px-5 py-3 text-slate-700">
                    {m.currentPlan?.title ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {formatDate(m.expiryDate)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone(m.status)}>{m.status}</Badge>
                  </td>
                </tr>
              ))}
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

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add member"
      >
        <MemberForm
          plans={plans ?? []}
          submitting={createMember.isPending}
          error={createMember.error?.message}
          onCreate={handleCreate}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </>
  )
}
