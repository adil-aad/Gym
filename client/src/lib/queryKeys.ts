import type { MemberQuery, PaymentQuery } from '../types'

// Central query-key factory. Mutations invalidate at the root keys
// (['members'], ['plans'], ['payments']) so dependent lists stay fresh.
export const queryKeys = {
  auth: ['auth', 'me'] as const,

  members: ['members'] as const,
  membersList: (query: MemberQuery) => ['members', 'list', query] as const,
  member: (id: string) => ['members', 'detail', id] as const,
  membersExpiring: (days: number) => ['members', 'expiring', days] as const,

  plans: ['plans'] as const,
  plansList: (includeInactive: boolean) => ['plans', 'list', includeInactive] as const,

  payments: ['payments'] as const,
  paymentsList: (query: PaymentQuery) => ['payments', 'list', query] as const,
  revenue: (year: number) => ['payments', 'revenue', year] as const,
}
