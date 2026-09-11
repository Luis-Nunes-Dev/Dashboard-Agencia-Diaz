import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAppData } from '../hooks/useAppData'

const AuthContext = createContext(null)
const AUTH_STORAGE_KEY = 'agencia-diaz-auth'

export function AuthProvider({ children }) {
  const { users, currentUser, setCurrentUser } = useAppData()
  const [session, setSession] = useState(() => {
    try {
      const saved = window.localStorage.getItem(AUTH_STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (session?.userId) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
      return
    }
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  }, [session])

  useEffect(() => {
    if (!session?.userId) return
    const isValidUser = users.some((user) => user.id === session.userId)
    if (!isValidUser) {
      setSession(null)
      setCurrentUser(null)
    }
  }, [session, users, setCurrentUser])

  const value = useMemo(() => ({
    isAuthenticated: Boolean(session?.userId && currentUser),
    user: currentUser,
    login: (userName, password) => {
      const normalizedName = userName.trim()
      const candidate = users.find((user) => user.name.trim().toLowerCase() === normalizedName.toLowerCase())
      if (!candidate) return { ok: false, message: 'Usuário não encontrado.' }

      const storedPassword = candidate.password ?? 'agencia123'
      if (String(password || '').trim() !== String(storedPassword)) {
        return { ok: false, message: 'Senha inválida.' }
      }

      setCurrentUser(candidate.id)
      setSession({ userId: candidate.id, name: candidate.name })
      return { ok: true }
    },
    logout: () => {
      setCurrentUser(null)
      setSession(null)
    },
  }), [currentUser, session, setCurrentUser, users])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
