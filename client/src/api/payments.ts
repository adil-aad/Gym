import { api } from './client'
import type {
  ApiItem,
  ApiList,
  Payment,
  PaymentInput,
  PaymentQuery,
  RevenueAnalytics,
} from '../types'

export const paymentsApi = {
  // Admins can record; only owners can list/view/analyze (server route-gated).
  create: async (input: PaymentInput) => {
    const { data } = await api.post<ApiItem<Payment>>('/payments', input)
    return data.data
  },

  list: async (query: PaymentQuery = {}) => {
    const { data } = await api.get<ApiList<Payment>>('/payments', { params: query })
    return data
  },

  revenue: async (year?: number) => {
    const { data } = await api.get<ApiItem<RevenueAnalytics>>(
      '/payments/analytics/revenue',
      { params: year ? { year } : {} },
    )
    return data.data
  },
}
