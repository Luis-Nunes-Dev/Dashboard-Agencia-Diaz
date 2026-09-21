import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(nextSession) {
    if (!nextSession?.user) {
      setUser(null)
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role, created_at, updated_at')
      .eq('id', nextSession.user.id)
      .single()

    if (error) {
      setUser(null)
      return error
    }

    setUser({ ...data, email: nextSession.user.email, papel: data.role })
    return null
  }

  useEffect(() => {
    let mounted = true

    async function initialize() {
      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return
      if (error) {
        setSession(null)
        setUser(null)
      } else {
        setSession(data.session)
        await loadProfile(data.session)
      }
      if (mounted) setLoading(false)
    }

    initialize()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      if (!nextSession) {
        setUser(null)
        setLoading(false)
        return
      }
      setTimeout(() => { if (mounted) loadProfile(nextSession) }, 0)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({
    isAuthenticated: Boolean(session?.user && user),
    user,
    loading,
    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) return { ok: false, message: 'E-mail ou senha inválidos.' }

      const profileError = await loadProfile(data.session)
      if (profileError) {
        await supabase.auth.signOut()
        return { ok: false, message: 'Perfil do usuário não encontrado.' }
      }

      setSession(data.session)
      return { ok: true }
    },
    logout: () => supabase.auth.signOut(),
  }), [loading, session, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
