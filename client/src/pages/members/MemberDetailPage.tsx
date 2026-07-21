import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge, statusTone } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { FullPageSpinner } from '../../components/ui/Spinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { useAuth } from '../../context/AuthContext'
import {
  useMember,
  useUpdateMember,
  useDeleteMember,
} from '../../hooks/useMembers'
import { usePlans } from '../../hooks/usePlans'
import { formatDate, formatCurrency, daysUntil } from '../../lib/format'
import type { MemberUpdateInput } from '../../types'
import { MemberForm } from './MemberForm'
import { RenewMemberModal } from './RenewMemberModal'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value ?? '—'}</dd>
    </div>
  )
}

export default function MemberDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { isOwner } = useAuth()

  const { data: member, isLoading, isError, error } = useMember(id)
  const { data: plans } = usePlans(false)
  const updateMember = useUpdateMember()
  const deleteMember = useDeleteMember()

  const [editOpen, setEditOpen] = useState(false)
  const [renewOpen, setRenewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (isLoading) return <FullPageSpinner />
  if (isError || !member)
    return <ErrorMessage message={error?.message ?? 'Member not found.'} />

  const days = daysUntil(member.expiryDate)
  const expiringSoon = member.status === 'active' && days >= 0 && days <= 7

  const handleUpdate = (input: MemberUpdateInput) => {
    updateMember.mutate(
      { id: member._id, input },
      { onSuccess: () => setEditOpen(false) },
    )
  }

  const handleDelete = () => {
    deleteMember.mutate(member._id, {
      onSuccess: () => navigate('/members', { replace: true }),
    })
  }

  return (
    <>
      <PageHeader
        title={member.fullName}
        description={`Member since ${formatDate(member.createdAt)}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                updateMember.reset()
                setEditOpen(true)
              }}
            >
              Edit
            </Button>
            <Button onClick={() => setRenewOpen(true)}>Renew</Button>
            {isOwner && (
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Membership" />
          <CardBody>
            <dl className="grid grid-cols-2 gap-4">
              <Field
                label="Status"
                value={
                  <span className="inline-flex items-center gap-2">
                    <Badge tone={statusTone(member.status)}>{member.status}</Badge>
                    {expiringSoon && (
                      <Badge tone="amber">
                        expires in {days} day{days === 1 ? '' : 's'}
                      </Badge>
                    )}
                  </span>
                }
              />
              <Field
                label="Plan"
                value={
                  member.currentPlan
                    ? `${member.currentPlan.title}${
                        member.currentPlan.price != null
                          ? ` · ${formatCurrency(member.currentPlan.price)}`
                          : ''
                      }`
                    : '—'
                }
              />
              <Field label="Start date" value={formatDate(member.startDate)} />
              <Field label="Expiry date" value={formatDate(member.expiryDate)} />
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Profile" />
          <CardBody>
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Phone" value={member.phone} />
              <Field label="Email" value={member.email} />
              <Field
                label="Gender"
                value={
                  member.gender
                    ? member.gender[0].toUpperCase() + member.gender.slice(1)
                    : undefined
                }
              />
              <Field label="Emergency contact" value={member.emergencyContact} />
              <Field
                label="Added by"
                value={member.createdAdmin?.name}
              />
            </dl>
          </CardBody>
        </Card>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit member">
        <MemberForm
          initial={member}
          plans={plans ?? []}
          submitting={updateMember.isPending}
          error={updateMember.error?.message}
          onUpdate={handleUpdate}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <RenewMemberModal
        open={renewOpen}
        onClose={() => setRenewOpen(false)}
        member={member}
        plans={plans ?? []}
      />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete member"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMember.isPending}
              onClick={handleDelete}
            >
              Delete permanently
            </Button>
          </>
        }
      >
        {deleteMember.error && (
          <div className="mb-3">
            <ErrorMessage message={deleteMember.error.message} />
          </div>
        )}
        <p className="text-sm text-slate-600">
          Permanently delete{' '}
          <span className="font-medium">{member.fullName}</span>? This cannot be
          undone. Consider suspending instead if they may return.
        </p>
      </Modal>
    </>
  )
}
