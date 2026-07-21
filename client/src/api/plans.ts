import { api } from './client'
import type { ApiCount, ApiItem, Plan, PlanInput } from '../types'

export const plansApi = {
  list: async (includeInactive = false) => {
    const { data } = await api.get<ApiCount<Plan>>('/plans', {
      params: includeInactive ? { includeInactive: 'true' } : {},
    })
    return data.data
  },

  create: async (input: PlanInput) => {
    const { data } = await api.post<ApiItem<Plan>>('/plans', input)
    return data.data
  },

  update: async (id: string, input: Partial<PlanInput> & { isActive?: boolean }) => {
    const { data } = await api.patch<ApiItem<Plan>>(`/plans/${id}`, input)
    return data.data
  },

  // Soft delete — server deactivates rather than removing.
  deactivate: async (id: string) => {
    const { data } = await api.delete<ApiItem<Plan>>(`/plans/${id}`)
    return data.data
  },
}
