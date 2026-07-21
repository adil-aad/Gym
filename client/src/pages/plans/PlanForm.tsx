import { useState, type FormEvent } from 'react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import type { Plan, PlanInput } from '../../types'

interface PlanFormProps {
  initial?: Plan
  submitting: boolean
  error?: string
  onSubmit: (input: PlanInput) => void
  onCancel: () => void
}

type Errors = Partial<Record<'title' | 'durationInMonths' | 'price', string>>

export function PlanForm({
  initial,
  submitting,
  error,
  onSubmit,
  onCancel,
}: PlanFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [duration, setDuration] = useState(
    initial ? String(initial.durationInMonths) : '',
  )
  const [price, setPrice] = useState(initial ? String(initial.price) : '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [errors, setErrors] = useState<Errors>({})

  const validate = (): PlanInput | null => {
    const next: Errors = {}
    const trimmedTitle = title.trim()
    const durationNum = Number(duration)
    const priceNum = Number(price)

    if (!trimmedTitle) next.title = 'Title is required'
    if (!duration || !Number.isInteger(durationNum) || durationNum < 1)
      next.durationInMonths = 'Enter a whole number of months (min 1)'
    if (price === '' || Number.isNaN(priceNum) || priceNum < 0)
      next.price = 'Enter a valid price'

    setErrors(next)
    if (Object.keys(next).length > 0) return null

    return {
      title: trimmedTitle,
      durationInMonths: durationNum,
      price: priceNum,
      description: description.trim() || undefined,
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const input = validate()
    if (input) onSubmit(input)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && <ErrorMessage message={error} />}
      <Input
        name="title"
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        placeholder="e.g. Monthly"
        autoFocus
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          name="durationInMonths"
          label="Duration (months)"
          type="number"
          min={1}
          step={1}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          error={errors.durationInMonths}
        />
        <Input
          name="price"
          label="Price"
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={errors.price}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="description"
          className="text-sm font-medium text-slate-700"
        >
          Description <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save changes' : 'Create plan'}
        </Button>
      </div>
    </form>
  )
}
