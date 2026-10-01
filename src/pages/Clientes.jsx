import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'

const initialForm = { name: '', segment: '', email: '' }

export function Clientes() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState('')
  const [open, setOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadClients() {
      const { data, error: queryError } = await supabase
        .from('clients')
        .select('id, created_at, name, email, segment, initials')
        .order('created_at', { ascending: false })

      if (!active) return
      if (queryError) {
        setDataError('Não foi possível carregar os clientes.')
        setLoading(false)
        return
      }

      setClients(data || [])
      setLoading(false)
    }

    loadClients()
    return () => { active = false }
  }, [])

  // Atualiza os campos controlados do formulário de cliente.
  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  // Valida e salva o cliente diretamente no Supabase.
  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.email.includes('@')) return setError('Informe nome e e-mail válidos.')

    const client = { ...form, name: form.name.trim(), email: form.email.trim(), initials: form.name.trim().slice(0, 2).toUpperCase() }
    const { data, error: insertError } = await supabase
      .from('clients')
      .insert(client)
      .select('id, created_at, name, email, segment, initials')
      .single()

    if (insertError) {
      setError('Não foi possível salvar o cliente.')
      return
    }

    setClients((current) => [data, ...current])
    setForm(initialForm)
    setError('')
    setOpen(false)
  }

  function editClient(client) {
    setEditingClient(client)
    setForm({ name: client.name, segment: client.segment || '', email: client.email, initials: client.initials || '' })
    setError('')
    setOpen(true)
  }

  async function handleUpdate(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.email.includes('@')) return setError('Informe nome e e-mail válidos.')

    const updates = {
      name: form.name.trim(),
      email: form.email.trim(),
      segment: form.segment.trim(),
      initials: form.initials.trim(),
    }
    const { data, error: updateError } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', editingClient.id)
      .select('id, created_at, name, email, segment, initials')
      .single()

    if (updateError) {
      setError(updateError.message || 'Não foi possível atualizar o cliente.')
      return
    }

    setClients((current) => current.map((client) => client.id === data.id ? data : client))
    setForm(initialForm)
    setEditingClient(null)
    setError('')
    setOpen(false)
  }

  function closeForm() {
    setOpen(false)
    if (editingClient) {
      setForm(initialForm)
      setEditingClient(null)
      setError('')
    }
  }

  async function deleteEntity(_entity, id) {
    setDataError('')
    const { error: deleteError } = await supabase.from('clients').delete().eq('id', id)
    if (deleteError) {
      setDataError('Não foi possível excluir o cliente.')
      return
    }
    setClients((current) => current.filter((client) => client.id !== id))
  }

  if (loading) return <div className="grid gap-6"><Card><p className="py-6 text-center text-sm text-[#737b91]">Carregando clientes...</p></Card></div>
  if (dataError) return <div className="grid gap-6"><Card><p className="py-6 text-center text-sm font-semibold text-[#b42345]">{dataError}</p></Card></div>

  return <div className="grid gap-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-semibold text-[#7138ef]">Relacionamentos</p><h1 className="text-3xl font-bold text-[#171b32]">Clientes</h1><p className="mt-2 text-sm text-[#737b91]">Gerencie a carteira da sua agência.</p></div><Button className="bg-[#7138ef] hover:bg-[#5f27d4]" onClick={() => setOpen(true)}>+ Adicionar cliente</Button></div><Card>{clients.length ? <div className="overflow-x-auto"><table className="w-full min-w-150 text-left text-sm"><thead><tr className="border-b border-[#edf1ee] text-[10px] uppercase tracking-[0.08em] text-[#9299ad]"><th className="px-5 py-3">Cliente</th><th className="px-5 py-3">Segmento</th><th className="px-5 py-3">E-mail</th><th className="px-5 py-3">Ações</th></tr></thead><tbody>{clients.map((client) => <tr key={client.id} className="border-b border-[#f0f1f6] last:border-0"><td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar initials={client.initials} /><span className="font-semibold text-[#30374e]">{client.name}</span></div></td><td className="px-5 py-4 text-[#606981]">{client.segment || 'Sem segmento'}</td><td className="px-5 py-4 text-[#606981]">{client.email}</td><td className="px-5 py-4"><button className="mr-3 text-xs font-semibold text-[#7138ef]" onClick={() => editClient(client)}>Editar</button><button className="text-xs font-semibold text-[#b42345]" onClick={() => deleteEntity('clients', client.id)}>Excluir</button></td></tr>)}</tbody></table></div> : <EmptyState title="Nenhum cliente cadastrado ainda" description="Adicione seu primeiro cliente para começar a organizar a agência." actionLabel="Adicionar cliente" onAction={() => setOpen(true)} />}</Card><Modal open={open} title={editingClient ? 'Editar cliente' : 'Novo cliente'} onClose={closeForm} onConfirm={editingClient ? handleUpdate : handleSubmit}><form className="grid gap-4" onSubmit={editingClient ? handleUpdate : handleSubmit}><Input label="Nome da empresa" name="name" value={form.name} onChange={handleChange} placeholder="Nome do cliente" />{editingClient && <Input label="Iniciais" name="initials" value={form.initials} onChange={handleChange} placeholder="Ex.: AC" />}<Input label="Segmento" name="segment" value={form.segment} onChange={handleChange} placeholder="Segmento de atuação" /><Input label="E-mail" name="email" type="email" value={form.email} onChange={handleChange} placeholder="contato@empresa.com" />{error && <p className="text-xs font-semibold text-[#b42345]">{error}</p>}</form></Modal></div>
}
