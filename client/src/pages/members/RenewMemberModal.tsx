import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { useRenewMember } from '../../hooks/useMembers'
import { useCreatePayment } from '../../hooks/usePayments'
import { formatDate, paymentMethodLabel } from '../../lib/format'
import type { Member, PaymentMethod, Plan } from '../../types'

const METHODS: PaymentMethod[] = ['cash', 'card', 'bank_transfer', 'other']

interface RenewMemberModalProps {
  open: boolean
  onClose: () => void
  member: Member
  plans: Plan[]
}

/**
 * Renew flow: POST /members/:id/renew, then optionally POST /payments.
 * If renewal succeeds but the payment fails we must NOT re-run the renewal
 * (it would extend the membership twice) — instead we surface a
 * "retry payment" state that only retries the payment call.
 */
export function RenewMemberModal({
  open,
  onClose,
  member,
  plans,
}: RenewMemberModalProps) {
  const renewMember = useRenewMember()
  const createPayment = useCreatePayment()

  const [planId, setPlanId] = useState('')
  const [recordPayment, setRecordPayment] = useState(true)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Set once renewal has succeeded — from then on we only retry the payment.
  const [renewedPlanId, setRenewedPlanId] = useState<string | null>(null)

  const selectedPlan = useMemo(
    () => plans.find((p) => p._id === planId),
    [plans, planId],
  )

  // Reset state each time the modal opens; default plan = member's current
  // plan when it's still active/selectable.
  useEffect(() => {
    if (!open) return
    const current = plans.find((p) => p._id === member.currentPlan?._id)
    setPlanId(current?._id ?? plans[0]?._id ?? '')
    setRecordPayment(true)
    setMethod('cash')
    setNotes('')
    setError(null)
    setSubmitting(false)
    setRenewedPlanId(null)
  }, [open, member, plans])

  // Prefill amount from the selected plan's price.
  useEffect(() => {
    if (selectedPlan) setAmount(String(selectedPlan.price))
  }, [selectedPlan])

  const submitPayment = async (paidPlanId: string) => {
    await createPayment.mutateAsync({
      member: member._id,
      plan: paidPlanId,
      amount: amount === '' ? undefined : Number(amount),
      paymentMethod: method,
      notes: notes.trim() || undefined,
    })
  }

  const handleSubmit = async () => {
    setError(null)

    if (recordPayment && amount !== '' && (Number.isNaN(Number(amount)) || Number(amount) < 0)) {
      setError('Enter a valid payment amount.')
      return
    }

    setSubmitting(true)
    try {
      let paidPlanId = renewedPlanId

      // Only renew if we haven't already succeeded on a previous attempt.
      if (!paidPlanId) {
        if (!planId) {
          setError('Select a plan.')
          setSubmitting(false)
          return
        }
        await renewMember.mutateAsync({ id: member._id, input: { plan: planId } })
        paidPlanId = planId
        setRenewedPlanId(planId)
      }

      if (recordPayment) {
        try {
          await submitPayment(paidPlanId)
        } catch (payErr) {
          // Renewal is done; only the payment needs retrying.
          setError(
            `Membership renewed, but recording the payment failed: ${
              payErr instanceof Error ? payErr.message : 'Unknown error'
            }. Retry the payment or close this dialog.`,
          )
          setSubmitting(false)
          return
        }
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Renewal failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const paymentFailedAfterRenew = renewedPlanId !== null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Renew ${member.fullName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {paymentFailedAfterRenew ? 'Close without payment' : 'Cancel'}
          </Button>
          <Button loading={submitting} onClick={handleSubmit}>
            {paymentFailedAfterRenew
              ? 'Retry payment'
              : recordPayment
                ? 'Renew & record payment'
                : 'Renew'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <ErrorMessage message={error} />}

        <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Current expiry: <span className="font-medium">{formatDate(member.expiryDate)}</span>
          {new Date(member.expiryDate) > new Date() && (
            <span> — renewing early keeps the remaining days.</span>
          )}
        </div>

        <Select
          name="plan"
          label="Plan"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          disabled={paymentFailedAfterRenew}
        >
          {plans.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title} · {p.durationInMonths} mo
            </option>
          ))}
        </Select>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={recordPayment}
            onChange={(e) => setRecordPayment(e.target.checked)}
            disabled={paymentFailedAfterRenew}
            className="h-4 w-4 rounded border-slate-300"
          />
          Record a payment
        </label>

        {recordPayment && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="amount"
              label="Amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Select
              name="paymentMethod"
              label="Method"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {paymentMethodLabel(m)}
                </option>
              ))}
            </Select>
            <div className="col-span-2">
              <Input
                name="notes"
                label="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
