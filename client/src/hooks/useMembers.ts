import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { membersApi } from '../api/members'
import { queryKeys } from '../lib/queryKeys'
import type {
  MemberInput,
  MemberQuery,
  MemberUpdateInput,
  RenewInput,
} from '../types'

export function useMembers(query: MemberQuery) {
  return useQuery({
    queryKey: queryKeys.membersList(query),
    queryFn: () => membersApi.list(query),
    // Keep the previous page visible while the next loads (avoids table flicker).
    placeholderData: keepPreviousData,
  })
}

export function useMember(id: string) {
  return useQuery({
    queryKey: queryKeys.member(id),
    queryFn: () => membersApi.get(id),
    enabled: !!id,
  })
}

export function useExpiringMembers(days = 7) {
  return useQuery({
    queryKey: queryKeys.membersExpiring(days),
    queryFn: () => membersApi.expiring(days),
  })
}

export function useCreateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MemberInput) => membersApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.members }),
  })
}

export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MemberUpdateInput }) =>
      membersApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.members }),
  })
}

export function useRenewMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RenewInput }) =>
      membersApi.renew(id, input),
    // Renewal creates a payment too — refresh both trees.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.members })
      qc.invalidateQueries({ queryKey: queryKeys.payments })
    },
  })
}

export function useDeleteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => membersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.members }),
  })
}
