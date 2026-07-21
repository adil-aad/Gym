import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency } from '../../lib/format'
import {
  usePlans,
  useCreatePlan,
  useUpdatePlan,
  useDeactivatePlan,
} from '../../hooks/usePlans'
import type { Plan, PlanInput } from '../../types'
import { PlanForm } from './PlanForm'

export default function PlansPage() {
  const { isOwner } = useAuth()
  // Owners can see inactive plans (to reactivate); admins see active only.
  const { data: plans, isLoading, isError, error } = usePlans(isOwner)
  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()
  const deactivatePlan = useDeactivatePlan()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [toDeactivate, setToDeactivate] = useState<Plan | null>(null)

  const mutation = editing ? updatePlan : createPlan
  const formError = mutation.error?.message

  const openCreate = () => {
    setEditing(null)
    createPlan.reset()
    setFormOpen(true)
  }

  const openEdit = (plan: Plan) => {
    setEditing(plan)
    updatePlan.reset()
    setFormOpen(true)
  }

  const handleSubmit = (input: PlanInput) => {
    if (editing) {
      updatePlan.mutate(
        { id: editing._id, input },
        { onSuccess: () => setFormOpen(false) },
      )
    } else {
      createPlan.mutate(input, { onSuccess: () => setFormOpen(false) })
    }
  }

  const confirmDeactivate = () => {
    if (!toDeactivate) return
    deactivatePlan.mutate(toDeactivate._id, {
      onSuccess: () => setToDeactivate(null),
    })
  }

  return (
    <>
      <PageHeader
        title="Plans"
        description="Membership plans offered at your gym."
        action={
          isOwner ? <Button onClick={openCreate}>New plan</Button> : undefined
        }
      />

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : isError ? (
          <div className="p-5">
            <ErrorMessage message={error?.message} />
          </div>
        ) : !plans || plans.length === 0 ? (
          <EmptyState
            title="No plans yet"
            description={
              isOwner
                ? 'Create your first membership plan to get started.'
                : 'No active plans are configured.'
            }
            action={isOwner ? <Button onClick={openCreate}>New plan</Button> : undefined}
          />
        ) : (
          <>
          {/* Mobile: card list. */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {plans.map((plan) => (
              <li key={plan._id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{plan.title}</p>
                    {plan.description && (
                      <p className="mt-0.5 text-xs text-slate-500">{plan.description}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      {plan.durationInMonths} mo · {formatCurrency(plan.price)}
                    </p>
                  </div>
                  <Badge tone={plan.isActive ? 'green' : 'slate'}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {isOwner && (
                  <div className="mt-2 flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}>
                      Edit
                    </Button>
                    {plan.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setToDeactivate(plan)}
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Desktop: table. */}
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-slate-100 text-left font-signage text-[0.625rem] text-slate-500">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
                {isOwner && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr
                  key={plan._id}
                  className="border-b border-slate-50 last:border-0"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900">{plan.title}</div>
                    {plan.description && (
                      <div className="text-xs text-slate-500">
                        {plan.description}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {plan.durationInMonths} mo
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {formatCurrency(plan.price)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={plan.isActive ? 'green' : 'slate'}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  {isOwner && (
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(plan)}
                        >
                          Edit
                        </Button>
                        {plan.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setToDeactivate(plan)}
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit plan' : 'New plan'}
      >
        <PlanForm
          initial={editing ?? undefined}
          submitting={mutation.isPending}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <Modal
        open={!!toDeactivate}
        onClose={() => setToDeactivate(null)}
        title="Deactivate plan"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDeactivate(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deactivatePlan.isPending}
              onClick={confirmDeactivate}
            >
              Deactivate
            </Button>
          </>
        }
      >
        {deactivatePlan.error && (
          <div className="mb-3">
            <ErrorMessage message={deactivatePlan.error.message} />
          </div>
        )}
        <p className="text-sm text-slate-600">
          Deactivate <span className="font-medium">{toDeactivate?.title}</span>?
          It will no longer be selectable for new members, but existing members
          keep their plan.
        </p>
      </Modal>
    </>
  )
}
