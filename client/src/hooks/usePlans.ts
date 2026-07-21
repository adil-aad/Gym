import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { plansApi } from '../api/plans'
import { queryKeys } from '../lib/queryKeys'
import type { PlanInput } from '../types'

export function usePlans(includeInactive = false) {
  return useQuery({
    queryKey: queryKeys.plansList(includeInactive),
    queryFn: () => plansApi.list(includeInactive),
  })
}

export function useCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PlanInput) => plansApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.plans }),
  })
}

export function useUpdatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<PlanInput> & { isActive?: boolean }
    }) => plansApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.plans }),
  })
}

export function useDeactivatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => plansApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.plans }),
  })
}
