import { api } from './client'
import type {
  ApiItem,
  User,
  LoginInput,
  PasswordInput,
  RegisterStaffInput,
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
}
