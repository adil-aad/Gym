// Shared types mirroring the Express API responses (server/src).

export type Role = 'owner' | 'admin'
export type MemberStatus = 'active' | 'expired' | 'suspended'
export type Gender = 'male' | 'female' | 'other'
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'other'

export interface User {
  _id: string
  name: string
  email: string
  role: Role
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Plan {
  _id: string
  title: string
  durationInMonths: number
  price: number
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** Populated plan on a member/payment — the server only selects a subset of fields. */
export interface PlanRef {
  _id: string
  title: string
  durationInMonths?: number
  price?: number
}

export interface UserRef {
  _id: string
  name: string
  email?: string
}

export interface Member {
  _id: string
  fullName: string
  phone: string
  email?: string
  gender?: Gender
  emergencyContact?: string
  currentPlan: PlanRef
  startDate: string
  expiryDate: string
  status: MemberStatus
  createdAdmin?: UserRef
  isExpired: boolean
  createdAt: string
  updatedAt: string
}

export interface Payment {
  _id: string
  member: { _id: string; fullName: string; phone: string } | string
  plan: PlanRef | string
  amount: number
  paymentMethod: PaymentMethod
  paymentDate: string
  processedBy?: UserRef
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MemberStats {
  total: number
  byStatus: Record<MemberStatus, number>
  newThisMonth: number
  newLastMonth: number
}

export interface MonthlyRevenue {
  month: number
  revenue: number
  payments: number
}

export interface MethodRevenue {
  method: PaymentMethod
  revenue: number
  payments: number
}

export interface RevenueAnalytics {
  year: number
  totalRevenue: number
  totalPayments: number
  yearRevenue: number
  monthlyBreakdown: MonthlyRevenue[]
  byPaymentMethod: MethodRevenue[]
}

// ─── API envelopes ──────────────────────────────────────────────────────────

export interface ApiItem<T> {
  success: boolean
  data: T
  message?: string
  token?: string
}

export interface ApiList<T> {
  success: boolean
  count: number
  total: number
  page: number
  pages: number
  data: T[]
}

/** Simpler list envelope (plans, expiring members) — no pagination. */
export interface ApiCount<T> {
  success: boolean
  count: number
  data: T[]
}

// ─── Input types ──────────────────────────────────────────────────────────

export interface LoginInput {
  email: string
  password: string
}

export interface PlanInput {
  title: string
  durationInMonths: number
  price: number
  description?: string
}

export interface MemberInput {
  fullName: string
  phone: string
  email?: string
  gender?: Gender
  emergencyContact?: string
  currentPlan: string
  startDate?: string
  expiryDate?: string
}

export interface MemberUpdateInput {
  fullName?: string
  phone?: string
  email?: string
  gender?: Gender
  emergencyContact?: string
  status?: MemberStatus
}

export interface RenewInput {
  plan?: string
}

export interface PaymentInput {
  member: string
  plan: string
  amount?: number
  paymentMethod?: PaymentMethod
  paymentDate?: string
  notes?: string
}

export interface RegisterStaffInput {
  name: string
  email: string
  password: string
  role?: Role
}

export interface PasswordInput {
  currentPassword: string
  newPassword: string
}

export interface MemberQuery {
  status?: MemberStatus
  search?: string
  page?: number
  limit?: number
}

export interface PaymentQuery {
  member?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}
