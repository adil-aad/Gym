// Display formatting helpers.

const dateFmt = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

// Ethiopian Birr, shown without decimals (whole Birr) and a trailing unit.
const currencyFmt = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

export function formatDate(value?: string | Date | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : dateFmt.format(d)
}

export function formatCurrency(value?: number | null): string {
  return `${currencyFmt.format(value ?? 0)} Birr`
}

/** Whole days from now until `value`. Negative = already past. */
export function daysUntil(value?: string | Date | null): number {
  if (!value) return 0
  const target = new Date(value).getTime()
  const now = Date.now()
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** 1-indexed month number → short name (matches server's $month output). */
export function monthName(month: number): string {
  return MONTHS[month - 1] ?? String(month)
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  other: 'Other',
}

export function paymentMethodLabel(method: string): string {
  return METHOD_LABELS[method] ?? method
}

/** For <input type="date"> value binding — yyyy-mm-dd in local time. */
export function toDateInput(value?: string | Date | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60 * 1000).toISOString().slice(0, 10)
}
