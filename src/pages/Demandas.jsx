import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'

const blank = { title: '', clientId: '', dueDate: '', status: 'A fazer', responsibleId: '' }
const statuses = ['A fazer', 'Em andamento', 'Concluída']

export function Demandas() {
  const [demands, setDemands] = useState([])
  const [clients, setClients] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState('')
  const [open, setOpen] = useState(false); const [form, setForm] = useState(blank); const [filter, setFilter] = useState('all'); const [selectedIds, setSelectedIds] = useState([]); const [bulkResponsible, setBulkResponsible] = useState(''); const [draggedId, setDraggedId] = useState(null)

  async function reloadData() {
    const [demandResult, clientResult, profileResult] = await Promise.all([
      supabase.from('demands').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('profiles').select('*'),
    ])
    const queryError = demandResult.error || clientResult.error || profileResult.error
    if (queryError) {
      setDataError('Não foi possível carregar os dados das demandas.')
      setLoading(false)
      return false
    }

    setDemands((demandResult.data || []).map((row) => ({
      ...row,
      clientId: row.client_id,
      responsibleId: row.responsible_id,
      dueDate: row.due_date || '',
    })))
    setClients(clientResult.data || [])
    setUsers(profileResult.data || [])
    setDataError('')
    setLoading(false)
    return true
  }

  useEffect(() => {
    Promise.all([
      supabase.from('demands').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('profiles').select('*'),
    ]).then(([demandResult, clientResult, profileResult]) => {
      const queryError = demandResult.error || clientResult.error || profileResult.error
      if (queryError) {
        setDataError('Não foi possível carregar os dados das demandas.')
      } else {
        setDemands((demandResult.data || []).map((row) => ({
          ...row,
          clientId: row.client_id,
          responsibleId: row.responsible_id,
          dueDate: row.due_date || '',
        })))
        setClients(clientResult.data || [])
        setUsers(profileResult.data || [])
      }
      setLoading(false)
    })
  }, [])

  // Atualiza o formulário usado tanto para criar quanto para editar uma demanda.
  function change(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  // Persiste a demanda nova ou as alterações do registro selecionado.
  async function submit(event) {
    event.preventDefault()
    if (!form.title.trim()) return
    const payload = {
      title: form.title,
      status: form.status,
      client_id: form.clientId || null,
      responsible_id: form.responsibleId || null,
      due_date: form.dueDate || null,
    }
    const result = form.id
      ? await supabase.from('demands').update(payload).eq('id', form.id)
      : await supabase.from('demands').insert(payload).select('id').single()
    if (result.error) {
      window.alert('Não foi possível salvar a demanda.')
      return
    }
    await reloadData()
    setForm(blank)
    setOpen(false)
  }
  function edit(item) { setForm(item); setOpen(true) }
  function toggle(id) { setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]) }
  // Aplica um responsável a todas as demandas selecionadas na listagem.
  async function assignBulk(event) {
    const responsibleId = event.target.value
    setBulkResponsible(responsibleId)
    const results = await Promise.all(selectedIds.map((id) => supabase.from('demands').update({ responsible_id: responsibleId || null }).eq('id', id)))
    if (results.some((result) => result.error)) {
      window.alert('Não foi possível atualizar os responsáveis.')
      return
    }
    await reloadData()
  }
  // Move uma demanda entre colunas e mantém o novo status persistido.
  async function dropDemand(status) { if (draggedId) {
    const { error: updateError } = await supabase.from('demands').update({ status }).eq('id', draggedId)
    if (updateError) window.alert('Não foi possível atualizar o status da demanda.')
    else await reloadData()
  }
  setDraggedId(null) }

  async function updateDemandStatus(id, status) {
    const { error: updateError } = await supabase.from('demands').update({ status }).eq('id', id)
    if (updateError) window.alert('Não foi possível atualizar o status da demanda.')
    else await reloadData()
  }

  async function deleteDemand(id) {
    const { error: deleteError } = await supabase.from('demands').delete().eq('id', id)
    if (deleteError) window.alert('Não foi possível excluir a demanda.')
    else await reloadData()
  }

  if (loading) return <div className="grid gap-6"><Card><p className="py-6 text-center text-sm text-(--color-text-muted)">Carregando demandas...</p></Card></div>
  if (dataError) return <div className="grid gap-6"><Card><p className="py-6 text-center text-sm font-semibold text-[#b42345]">{dataError}</p></Card></div>
  const visibleDemands = filter === 'all' ? demands : demands.filter((item) => item.responsibleId === filter)
  return <div className="grid gap-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-semibold text-(--color-primary)">Operação</p><h1 className="text-3xl font-bold text-(--color-text)">Demandas</h1><p className="mt-2 text-sm text-(--color-text-muted)">Organize o fluxo do seu time.</p></div><div className="flex flex-wrap gap-2"><select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg border border-(--color-border) bg-white px-3 text-xs text-(--color-text-muted)"><option value="all">Todos responsáveis</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select><Button className="bg-(--color-primary) hover:bg-(--color-primary-hover)" onClick={() => { setForm(blank); setOpen(true) }}>+ Nova demanda</Button></div></div>{selectedIds.length > 0 && <div className="flex flex-wrap items-center gap-3 rounded-lg border border-(--color-primary-light) bg-(--color-primary-light) p-3 text-xs text-(--color-primary)"><span>{selectedIds.length} selecionada(s)</span><select value={bulkResponsible} onChange={assignBulk} className="rounded-md border border-(--color-border) bg-white px-2 py-1.5"><option value="">Definir responsável</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></div>}<div className="grid gap-4 lg:grid-cols-3">{statuses.map((status) => <Card key={status} onDragOver={(event) => event.preventDefault()} onDrop={() => dropDemand(status)} className={`bg-(--color-surface) p-4 transition ${draggedId ? 'ring-2 ring-(--color-primary-light)' : ''}`}><div className="mb-4 flex items-center gap-2"><h2 className="font-bold text-(--color-text)">{status}</h2><Badge>{visibleDemands.filter((item) => item.status === status).length}</Badge></div><div className="grid min-h-24 gap-3">{visibleDemands.filter((item) => item.status === status).map((item) => { const responsible = users.find((user) => user.id === item.responsibleId); return <div key={item.id} draggable onDragStart={() => setDraggedId(item.id)} onDragEnd={() => setDraggedId(null)} className={`cursor-grab rounded-lg border border-(--color-border) bg-white p-4 active:cursor-grabbing ${draggedId === item.id ? 'opacity-50' : ''}`}><div className="flex items-start gap-2"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggle(item.id)} className="mt-1 accent-(--color-primary)" /><button onClick={() => edit(item)} className="text-left text-sm font-semibold text-(--color-text)">{item.title}</button></div><p className="mt-2 text-xs text-(--color-text-muted)">{clients.find((client) => client.id === item.clientId)?.name || 'Sem cliente'}</p>{responsible && <div className="mt-3 flex items-center gap-2"><Avatar initials={responsible.name.slice(0, 2).toUpperCase()} className="h-6 w-6 text-[10px]" /><span className="text-xs text-(--color-text-muted)">{responsible.name}</span></div>}<div className="mt-3 flex justify-between"><select value={item.status} onChange={(event) => updateDemandStatus(item.id, event.target.value)} className="text-xs text-(--color-primary)">{statuses.map((option) => <option key={option}>{option}</option>)}</select><button onClick={() => deleteDemand(item.id)} className="text-xs text-[#b42345]">Excluir</button></div></div> })}</div></Card>)}</div>{!demands.length && <Card><EmptyState title="Nenhuma demanda cadastrada" description="Crie uma demanda para começar a acompanhar seu trabalho." actionLabel="Criar demanda" onAction={() => setOpen(true)} /></Card>}<Modal open={open} title={form.id ? 'Editar demanda' : 'Nova demanda'} onClose={() => setOpen(false)} onConfirm={submit}><form onSubmit={submit} className="grid gap-4"><Input label="Título" name="title" value={form.title} onChange={change} placeholder="Nome da demanda" /><label className="grid gap-1.5 text-sm font-medium text-(--color-text-muted)">Cliente<select name="clientId" value={form.clientId} onChange={change} className="rounded-lg border border-(--color-border) px-3 py-2.5 text-sm"><option value="">Sem cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label><label className="grid gap-1.5 text-sm font-medium text-(--color-text-muted)">Responsável<select name="responsibleId" value={form.responsibleId} onChange={change} className="rounded-lg border border-(--color-border) px-3 py-2.5 text-sm"><option value="">Sem responsável</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label><Input label="Prazo" type="date" name="dueDate" value={form.dueDate} onChange={change} /></form></Modal></div>
}

