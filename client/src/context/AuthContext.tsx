import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth'
import { tokenStore } from '../api/client'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isOwner: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  // On mount: if a token is present, resolve the current user. A 401 here is
  // handled by the axios interceptor (clears token + redirects).
  useEffect(() => {
    const token = tokenStore.get()
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        tokenStore.clear()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    tokenStore.set(res.token)
    setUser(res.data)
  }

  const logout = () => {
    tokenStore.clear()
    setUser(null)
    // Drop all cached queries so a different role logging in next doesn't see
    // the previous user's data.
    queryClient.clear()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isOwner: user?.role === 'owner',
        loading,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
