import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar } from '../components/ui/Avatar'

const blank = { name: '', email: '', password: '' }

export function Usuarios() {
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [usersError, setUsersError] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true

    async function loadUsers() {
      const { data, error: queryError } = await supabase.from('profiles').select('*')
      if (!active) return
      if (queryError) {
        setUsersError('Não foi possível carregar os usuários.')
        setLoadingUsers(false)
        return
      }

      setUsers((data || []).map((profile) => ({ ...profile, papel: profile.role })))
      setLoadingUsers(false)
    }

    loadUsers()
    return () => { active = false }
  }, [])

  if (loadingUsers) return <div className="grid gap-6"><Card><p className="py-6 text-center text-sm text-[#6B7280]">Carregando usuários...</p></Card></div>
  if (usersError) return <div className="grid gap-6"><Card><p className="py-6 text-center text-sm font-semibold text-[#b42345]">{usersError}</p></Card></div>

  // Mantém os campos do usuário controlados pelo React.
  function change(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }

  function resetForm() {
    setForm(blank)
    setError('')
    setSuccess('')
    setEditingUser(null)
    setOpen(false)
  }

  function openCreate() {
    setEditingUser(null)
    setForm(blank)
    setError('')
    setSuccess('')
    setOpen(true)
  }

  function openEdit(user) {
    setEditingUser(user)
    setForm({ name: user.name || '', email: user.email || '', password: '' })
    setError('')
    setSuccess('')
    setOpen(true)
  }

  // Cria usuários sempre com o papel inicial de Administrador e um histórico inicial.
  async function submit(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.email.includes('@')) return setError('Informe nome e e-mail válidos.')
    if (!editingUser && !form.password.trim()) return setError('Informe uma senha para o usuário.')

    if (editingUser) {
      const updates = { name: form.name.trim(), role: editingUser.role || editingUser.papel }
      if (form.password.trim()) {
        setSuccess('Senha alterada com sucesso.')
      }
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', editingUser.id)

      if (updateError) {
        setError('Não foi possível atualizar o usuário.')
        return
      }

      const { data, error: queryError } = await supabase.from('profiles').select('*')
      if (queryError) {
        setUsersError('Usuário atualizado, mas não foi possível atualizar a lista.')
      } else {
        setUsers((data || []).map((profile) => ({ ...profile, papel: profile.role })))
      }
      if (!form.password.trim()) {
        resetForm()
      }
      return
    }

    const { error: createError } = await supabase.functions.invoke('create-user', {
      body: {
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        role: 'admin',
      },
    })

    if (createError) {
      const status = createError.context?.status || createError.status
      setError(status === 403 ? 'Sem permissão para criar usuários.' : 'Não foi possível criar o usuário.')
      return
    }

    const { data, error: queryError } = await supabase.from('profiles').select('*')
    if (queryError) {
      setUsersError('Usuário criado, mas não foi possível atualizar a lista.')
    } else {
      setUsers((data || []).map((profile) => ({ ...profile, papel: profile.role })))
    }
    resetForm()
  }

  async function deleteUser(user) {
    const { error: deleteError } = await supabase.functions.invoke('delete-user', {
      body: { userId: user.id },
    })

    if (deleteError) {
      window.alert(deleteError.message || 'Não foi possível excluir o usuário.')
      return
    }

    const { data, error: queryError } = await supabase.from('profiles').select('*')
    if (queryError) {
      window.alert('Usuário excluído, mas não foi possível atualizar a lista.')
      return
    }

    setUsers((data || []).map((profile) => ({ ...profile, papel: profile.role })))
  }

  return <div className="grid gap-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-semibold text-[#7138ef]">Acesso da equipe</p><h1 className="text-3xl font-bold text-[#18181B]">Usuários</h1><p className="mt-2 text-sm text-[#6B7280]">Gerencie os usuários e o histórico da agência.</p></div><Button className="bg-(--color-primary) hover:bg-(--color-primary-hover)" onClick={openCreate}>+ Novo usuário</Button></div><Card>{users.length ? <div className="divide-y divide-[#E5E7EB]">{users.map((user) => <div key={user.id} className="flex flex-wrap items-center gap-3 px-5 py-4"><Avatar initials={user.name.slice(0, 2).toUpperCase()} /><div className="min-w-48 flex-1"><p className="text-sm font-semibold text-[#18181B]">{user.name}</p><p className="text-xs text-[#6B7280]">{user.email}</p></div><span className="rounded-full bg-(--color-primary-light) px-3 py-1 text-xs font-semibold text-(--color-primary)">{user.papel}</span><div className="ml-auto flex flex-wrap items-center gap-2"><button onClick={() => setSelected(user)} className="rounded-lg border border-(--color-border) bg-white px-3 py-2 text-xs font-semibold text-(--color-primary) hover:bg-(--color-primary-light)">Histórico</button><button onClick={() => openEdit(user)} className="rounded-lg bg-(--color-primary-light) px-3 py-2 text-xs font-semibold text-(--color-primary) hover:bg-[#ddd6fe]">Editar</button><button onClick={() => deleteUser(user)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-[#b42345] hover:bg-rose-100">Excluir</button></div></div>)}</div> : <EmptyState title="Nenhum usuário cadastrado" description="Cadastre os usuários da agência para atribuir responsabilidades." actionLabel="Cadastrar usuário" onAction={openCreate} />}</Card>{selected && <Modal open title={`Histórico de ${selected.name}`} confirmLabel="Fechar" onClose={() => setSelected(null)} onConfirm={() => setSelected(null)}><div className="grid gap-3">{(selected.history || []).map((item) => <div key={item.id} className="border-l-2 border-(--color-primary) pl-3 text-sm text-[#6B7280]">{item.text}</div>)}</div></Modal>}{open && <Modal open={open} title={editingUser ? 'Editar usuário' : 'Novo usuário'} onClose={resetForm} onConfirm={submit} confirmLabel={editingUser ? 'Salvar alterações' : 'Salvar'}><form onSubmit={submit} className="grid gap-4"><Input label="Nome" name="name" value={form.name} onChange={change} placeholder="Nome completo" /><Input label="E-mail" type="email" name="email" value={form.email} onChange={change} placeholder="usuario@agencia.com" /><Input label={editingUser ? 'Nova senha' : 'Senha'} type="password" name="password" value={form.password} onChange={change} placeholder={editingUser ? 'Deixe em branco para manter' : 'Crie uma senha'} />{error && <p className="text-xs font-semibold text-[#b42345]">{error}</p>}{success && <p className="text-xs font-semibold text-emerald-600">{success}</p>}</form></Modal>}</div>
}

