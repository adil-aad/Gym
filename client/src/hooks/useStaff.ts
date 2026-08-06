import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth'
import { queryKeys } from '../lib/queryKeys'
import type { StaffUpdateInput } from '../types'

export function useStaff() {
  return useQuery({
    queryKey: queryKeys.staff,
    queryFn: () => authApi.users(),
  })
}

export function useUpdateStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: StaffUpdateInput }) =>
      authApi.updateUser(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.staff }),
  })
}

export function useDeleteStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => authApi.deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.staff }),
  })
}
