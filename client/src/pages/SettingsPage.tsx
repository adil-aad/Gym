import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/auth'
import { tokenStore } from '../api/client'
import { queryKeys } from '../lib/queryKeys'
import { useStaff, useUpdateStaff, useDeleteStaff } from '../hooks/useStaff'
import { formatDate } from '../lib/format'
import type { Role, User } from '../types'

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirm) {
      setError('New passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      // Server rotates the JWT on password change — keep the new one.
      const res = await authApi.updatePassword({ currentPassword, newPassword })
      tokenStore.set(res.token)
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Change password"
        subtitle="You'll stay signed in after changing it."
      />
      <CardBody>
        <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
          <Input
            type="password"
            name="currentPassword"
            label="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Input
            type="password"
            name="newPassword"
            label="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Input
            type="password"
            name="confirmPassword"
            label="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          {error && <ErrorMessage message={error} />}
          {success && (
            <p className="text-sm text-green-700">Password updated.</p>
          )}
          <Button type="submit" loading={submitting}>
            Update password
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}

function RegisterStaffCard() {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('admin')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setCreated(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    try {
      const user = await authApi.registerStaff({ name, email, password, role })
      setCreated(`${user.name} (${user.email}) can now sign in.`)
      setName('')
      setEmail('')
      setPassword('')
      setRole('admin')
      // Surface the new hire in the staff roster immediately (admins only).
      if (user.role === 'admin') {
        qc.invalidateQueries({ queryKey: queryKeys.staff })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Add staff account"
        subtitle="Create a login for front-desk staff. Admins can manage members and record payments but can't see revenue."
      />
      <CardBody>
        <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
          <Input
            name="staffName"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            name="staffEmail"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            required
          />
          <Input
            type="password"
            name="staffPassword"
            label="Temporary password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Select
            name="staffRole"
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="admin">Admin (front desk)</option>
            <option value="owner">Owner (full access)</option>
          </Select>
          {error && <ErrorMessage message={error} />}
          {created && <p className="text-sm text-green-700">{created}</p>}
          <Button type="submit" loading={submitting}>
            Create account
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}

function ManageStaffCard() {
  const { data: staff, isLoading, isError, error } = useStaff()
  const updateStaff = useUpdateStaff()
  const deleteStaff = useDeleteStaff()
  const [toDelete, setToDelete] = useState<User | null>(null)

  // Track which row is mutating so only its buttons show a spinner.
  const pendingId =
    (updateStaff.isPending && updateStaff.variables?.id) ||
    (deleteStaff.isPending && deleteStaff.variables) ||
    null

  const toggleActive = (s: User) =>
    updateStaff.mutate({ id: s._id, input: { isActive: !s.isActive } })

  const runDelete = () => {
    if (!toDelete) return
    deleteStaff.mutate(toDelete._id, { onSuccess: () => setToDelete(null) })
  }

  return (
    <Card>
      <CardHeader
        title="Staff accounts"
        subtitle="Admins you've appointed. Deactivate to block sign-in without deleting."
      />
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : isError ? (
        <div className="p-5">
          <ErrorMessage message={error?.message} />
        </div>
      ) : !staff || staff.length === 0 ? (
        <EmptyState
          title="No staff yet"
          description="Add a staff account below to give front-desk access."
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {staff.map((s) => {
            const busy = pendingId === s._id
            return (
              <li
                key={s._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-slate-900">{s.name}</p>
                    {!s.isActive && <Badge tone="slate">Deactivated</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-500">{s.email}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Added {formatDate(s.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={busy && updateStaff.isPending}
                    disabled={busy}
                    onClick={() => toggleActive(s)}
                  >
                    {s.isActive ? 'Deactivate' : 'Reactivate'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={busy}
                    onClick={() => setToDelete(s)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Delete staff account"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteStaff.isPending}
              onClick={runDelete}
            >
              Delete account
            </Button>
          </>
        }
      >
        {toDelete && (
          <p className="text-sm text-slate-600">
            Permanently delete <strong>{toDelete.name}</strong>'s account? They will
            no longer be able to sign in. Records they created (members, payments)
            are kept. This can't be undone.
          </p>
        )}
        {deleteStaff.isError && (
          <div className="mt-3">
            <ErrorMessage
              message={
                deleteStaff.error instanceof Error
                  ? deleteStaff.error.message
                  : 'Something went wrong.'
              }
            />
          </div>
        )}
      </Modal>
    </Card>
  )
}

export default function SettingsPage() {
  const { user, isOwner } = useAuth()

  return (
    <>
      <PageHeader title="Settings" description="Your account and gym staff." />

      <div className="space-y-6">
        <Card>
          <CardHeader title="Account" />
          <CardBody>
            <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Name</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {user?.name}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {user?.email}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Role</dt>
                <dd className="mt-0.5">
                  <Badge tone={isOwner ? 'blue' : 'slate'}>
                    {user?.role}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Member since</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {formatDate(user?.createdAt)}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <ChangePasswordCard />

        {isOwner && <ManageStaffCard />}
        {isOwner && <RegisterStaffCard />}
      </div>
    </>
  )
}
