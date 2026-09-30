import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    const result = await login(form.username, form.password)
    if (!result.ok) {
      setError(result.message)
      return
    }

    const next = location.state?.from?.pathname || '/'
    navigate(next, { replace: true })
  }

  return <div className="flex min-h-screen items-center justify-center bg-[#7C3AED] px-4 py-8">
    <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/95 p-6 shadow-[0_20px_45px_rgba(25,10,58,0.25)] backdrop-blur-sm sm:p-8">
      <div className="mb-6 flex justify-center">
        <img src="/logodiaz.png" alt="DIAZ Agência" className="h-auto w-40 object-contain" />
      </div>

      <form onSubmit={submit} className="grid gap-4">
        <Input label="Usuário" name="username" value={form.username} onChange={change} placeholder="Digite seu usuário" autoComplete="username" />
        <Input label="Senha" type="password" name="password" value={form.password} onChange={change} placeholder="Digite sua senha" autoComplete="current-password" />
        {error && <p className="text-xs font-semibold text-[#b42345]">{error}</p>}
        <Button type="submit" className="mt-2 w-full bg-(--color-primary) hover:bg-(--color-primary-hover)">Entrar</Button>
      </form>
    </div>
  </div>
}
