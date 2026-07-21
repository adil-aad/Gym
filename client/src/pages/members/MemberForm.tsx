import { useState, type FormEvent } from 'react'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { toDateInput } from '../../lib/format'
import type {
  Gender,
  Member,
  MemberInput,
  MemberStatus,
  MemberUpdateInput,
  Plan,
} from '../../types'

interface MemberFormProps {
  initial?: Member
  plans: Plan[]
  submitting: boolean
  error?: string
  onCreate?: (input: MemberInput) => void
  onUpdate?: (input: MemberUpdateInput) => void
  onCancel: () => void
}

const GENDERS: Gender[] = ['male', 'female', 'other']
const STATUSES: MemberStatus[] = ['active', 'expired', 'suspended']

export function MemberForm({
  initial,
  plans,
  submitting,
  error,
  onCreate,
  onUpdate,
  onCancel,
}: MemberFormProps) {
  const isEdit = !!initial
  const [fullName, setFullName] = useState(initial?.fullName ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [gender, setGender] = useState<string>(initial?.gender ?? '')
  const [emergency, setEmergency] = useState(initial?.emergencyContact ?? '')
  // Create-only fields.
  const [planId, setPlanId] = useState('')
  const [startDate, setStartDate] = useState(toDateInput(new Date()))
  // Edit-only field.
  const [status, setStatus] = useState<MemberStatus>(initial?.status ?? 'active')

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!fullName.trim()) next.fullName = 'Full name is required'
    if (!phone.trim()) next.phone = 'Phone is required'
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim()))
      next.email = 'Enter a valid email'
    if (!isEdit && !planId) next.planId = 'Select a plan'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    if (isEdit) {
      const update: MemberUpdateInput = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        gender: (gender as Gender) || undefined,
        emergencyContact: emergency.trim() || undefined,
        status,
      }
      onUpdate?.(update)
    } else {
      const create: MemberInput = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        gender: (gender as Gender) || undefined,
        emergencyContact: emergency.trim() || undefined,
        currentPlan: planId,
        startDate: startDate || undefined,
      }
      onCreate?.(create)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && <ErrorMessage message={error} />}

      <Input
        name="fullName"
        label="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={errors.fullName}
        autoFocus
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          name="phone"
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
        />
        <Input
          name="email"
          label="Email (optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select
          name="gender"
          label="Gender (optional)"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="">—</option>
          {GENDERS.map((g) => (
            <option key={g} value={g}>
              {g[0].toUpperCase() + g.slice(1)}
            </option>
          ))}
        </Select>
        <Input
          name="emergencyContact"
          label="Emergency contact (optional)"
          value={emergency}
          onChange={(e) => setEmergency(e.target.value)}
        />
      </div>

      {isEdit ? (
        <Select
          name="status"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as MemberStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </Select>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Select
            name="currentPlan"
            label="Plan"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            error={errors.planId}
          >
            <option value="">Select a plan…</option>
            {plans.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title} · {p.durationInMonths} mo
              </option>
            ))}
          </Select>
          <Input
            name="startDate"
            label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {isEdit ? 'Save changes' : 'Add member'}
        </Button>
      </div>
    </form>
  )
}
