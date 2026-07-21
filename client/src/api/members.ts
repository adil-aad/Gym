import { api } from './client'
import type {
  ApiCount,
  ApiItem,
  ApiList,
  Member,
  MemberInput,
  MemberQuery,
  MemberUpdateInput,
  RenewInput,
} from '../types'

export const membersApi = {
  list: async (query: MemberQuery = {}) => {
    const { data } = await api.get<ApiList<Member>>('/members', { params: query })
    return data
  },

  expiring: async (days = 7) => {
    const { data } = await api.get<ApiCount<Member>>('/members/expiring', {
      params: { days },
    })
    return data.data
  },

  get: async (id: string) => {
    const { data } = await api.get<ApiItem<Member>>(`/members/${id}`)
    return data.data
  },

  create: async (input: MemberInput) => {
    const { data } = await api.post<ApiItem<Member>>('/members', input)
    return data.data
  },

  update: async (id: string, input: MemberUpdateInput) => {
    const { data } = await api.patch<ApiItem<Member>>(`/members/${id}`, input)
    return data.data
  },

  renew: async (id: string, input: RenewInput) => {
    const { data } = await api.post<ApiItem<Member>>(`/members/${id}/renew`, input)
    return data.data
  },

  remove: async (id: string) => {
    const { data } = await api.delete<{ success: boolean; message: string }>(
      `/members/${id}`,
    )
    return data
  },
}
