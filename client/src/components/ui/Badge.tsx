import type { ReactNode } from 'react'

type Tone = 'green' | 'red' | 'amber' | 'slate' | 'blue'

const TONES: Record<Tone, string> = {
  green: 'bg-green-100 text-green-800 ring-green-600/20',
  red: 'bg-red-100 text-red-800 ring-red-600/20',
  amber: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  blue: 'bg-cobalt-100 text-cobalt-800 ring-cobalt-600/20',
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide ring-1 ring-inset ${TONES[tone]}`}
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
