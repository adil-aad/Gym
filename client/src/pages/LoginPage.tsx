import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ErrorMessage } from '../components/ui/ErrorMessage'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in — skip the form.
  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      // Failed login stays on the page (interceptor skips redirect for /auth/login).
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-[#0B1220] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <div className="mb-5 h-1 w-10 rounded-full bg-[#2F5FE0]" aria-hidden />
          <h1 className="font-signage text-2xl leading-none text-white">Gym Manager</h1>
          <p className="mt-2 font-signage text-[0.625rem] text-slate-400">Staff sign-in</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white p-8 shadow-lg">

          {/* Demo quick-fill */}
          <div className="mb-5">
            <p className="mb-2 text-xs text-slate-500">Try a demo account:</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => { setEmail('owner@gym.com'); setPassword('secret123') }}
              >
                Owner
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => { setEmail('admin@gym.com'); setPassword('secret123') }}
              >
                Admin
              </Button>
            </div>
          </div>

          <div className="mb-5 border-t border-slate-100" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <ErrorMessage message={error} />
          <Button type="submit" loading={submitting} className="w-full">
            Sign in
          </Button>
        </form>
        </div>
      </div>
    </div>
  )
}
