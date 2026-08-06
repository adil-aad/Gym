import { api } from './client'
import type {
  ApiCount,
  ApiItem,
  User,
  LoginInput,
  PasswordInput,
  RegisterStaffInput,
  StaffUpdateInput,
} from '../types'

interface LoginResponse extends ApiItem<User> {
  token: string
}

export const authApi = {
  login: async (input: LoginInput) => {
    const { data } = await api.post<LoginResponse>('/auth/login', input)
    return data
  },

  me: async () => {
    const { data } = await api.get<ApiItem<User>>('/auth/me')
    return data.data
  },

  updatePassword: async (input: PasswordInput) => {
    const { data } = await api.patch<{ success: boolean; message: string; token: string }>(
      '/auth/update-password',
      input,
    )
    return data
  },

  registerStaff: async (input: RegisterStaffInput) => {
    const { data } = await api.post<ApiItem<User>>('/auth/register', input)
    return data.data
  },

  // Owner-only staff roster (admins only, server-filtered).
  users: async () => {
    const { data } = await api.get<ApiCount<User>>('/auth/users')
    return data.data
  },

  updateUser: async (id: string, input: StaffUpdateInput) => {
    const { data } = await api.patch<ApiItem<User>>(`/auth/users/${id}`, input)
    return data.data
  },

  deleteUser: async (id: string) => {
    const { data } = await api.delete<{ success: boolean; message: string }>(
      `/auth/users/${id}`,
    )
    return data
  },
}
