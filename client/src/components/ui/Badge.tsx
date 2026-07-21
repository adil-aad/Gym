import type { ReactNode } from 'react'

type Tone = 'green' | 'red' | 'amber' | 'slate' | 'blue'

const TONES: Record<Tone, string> = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  amber: 'bg-amber-100 text-amber-800',
  slate: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-100 text-blue-800',
}

export function Badge({
  tone = 'slate',
  children,
}: {
  tone?: Tone
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  )
}

// Maps a member's status to a badge tone. `expiring` is a client-side notion
// (few days left); the server stores active/expired/suspended.
export function statusTone(status: string): Tone {
  switch (status) {
    case 'active':
      return 'green'
    case 'expiring':
      return 'amber'
    case 'expired':
      return 'red'
    case 'suspended':
      return 'slate'
    default:
      return 'slate'
  }
}
