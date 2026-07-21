import axios, { AxiosError } from 'axios'

const TOKEN_KEY = 'gym_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export const api = axios.create({
  baseURL: '/api',
})

// Attach the bearer token to every request when present.
api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401 (except a failed login attempt) the session is dead — clear it and
// bounce to /login. A full location change avoids stale in-memory auth state.
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''

    if (status === 401 && !url.includes('/auth/login')) {
      tokenStore.clear()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // Normalize to the server's message so callers can surface error.message.
    const message =
      error.response?.data?.message ??
      error.message ??
      'Something went wrong. Please try again.'
    return Promise.reject(new Error(message))
  },
)
