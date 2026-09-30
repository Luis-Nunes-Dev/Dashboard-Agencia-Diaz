import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar } from '../components/ui/Avatar'

const blank = { title: '', date: '', time: '', description: '', responsibleId: '', completed: false }

export function Agenda() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blank)
  const [filter, setFilter] = useState('all')
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState('')

  // Atualiza o compromisso em edição sem estado intermediário externo.
  function change(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }

  // Persiste um compromisso novo ou as mudanças de um registro antigo.
  async function submit(event) {
    event.preventDefault()
    if (!form.title || !form.date || !form.time) return
    const payload = {
      title: form.title,
      date: form.date,
      time: form.time,
      description: form.description || '',
      responsible_id: form.responsibleId || null,
      completed: form.completed || false,
      completed_at: form.completedAt || null,
    }
    const result = form.id
      ? await supabase.from('events').update(payload).eq('id', form.id).select('id').single()
      : await supabase.from('events').insert(payload).select('id').single()
    if (result.error) {
      setDataError('Não foi possível salvar o compromisso.')
      return
    }

    await reloadData()
    setForm(blank)
    setOpen(false)
  }

  // Marca ou reabre um compromisso sem removê-lo do histórico persistido.
  async function toggleCompleted(item) {
    const completed = !item.completed
    const { error: updateError } = await supabase
      .from('events')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', item.id)

    if (updateError) {
      setDataError('Não foi possível atualizar o compromisso.')
      return
    }

    await reloadData()
  }

  const filteredEvents = filter === 'all' ? events : events.filter((item) => item.responsibleId === filter)
  const activeEvents = filteredEvents.filter((item) => !item.completed)
  const completedEvents = filteredEvents.filter((item) => item.completed)
  const sortedEvents = [...activeEvents].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const sortedCompletedEvents = [...completedEvents].sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))

  // Renderiza uma linha comum para a agenda ativa e o histórico.
  function renderEvent(item, completed = false) {
    const responsible = users.find((user) => user.id === item.responsibleId)
    return <div key={item.id} className={`flex flex-wrap items-center gap-4 rounded-lg border-l-4 border-(--color-primary) px-4 py-4 ${completed ? 'bg-(--color-surface) opacity-75' : 'bg-(--color-primary-light)'}`}><div className="w-24 text-xs font-bold text-(--color-primary)">{item.date}<br /><span className="text-(--color-text-muted)">{item.time}</span></div><div className="min-w-0 flex-1"><button onClick={() => { setForm(item); setOpen(true) }} className={`font-semibold text-(--color-text) ${completed ? 'line-through' : ''}`}>{item.title}</button><p className="mt-1 text-xs text-(--color-text-muted)">{item.description || 'Sem descrição'}</p>{responsible && <div className="mt-2 flex items-center gap-2"><Avatar initials={responsible.name.slice(0, 2).toUpperCase()} className="h-6 w-6 text-[10px]" /><span className="text-xs text-(--color-text-muted)">{responsible.name}</span></div>}</div><div className="flex items-center gap-3"><button onClick={() => toggleCompleted(item)} className="text-xs font-semibold text-(--color-primary)">{completed ? 'Reabrir' : 'Finalizar'}</button><button onClick={() => deleteEvent(item.id)} className="text-xs font-semibold text-[#b42345]">Excluir</button></div></div>
  }

  async function reloadData() {
    const [eventResult, profileResult] = await Promise.all([
      supabase.from('events').select('*'),
      supabase.from('profiles').select('*'),
    ])
    if (eventResult.error || profileResult.error) {
      setDataError('Não foi possível carregar os compromissos.')
      setLoading(false)
      return false
    }

    setEvents((eventResult.data || []).map((row) => ({
      ...row,
      responsibleId: row.responsible_id || '',
      completedAt: row.completed_at,
    })))
    setUsers(profileResult.data || [])
    setDataError('')
    setLoading(false)
    return true
  }

  useEffect(() => {
    Promise.all([
      supabase.from('events').select('*'),
      supabase.from('profiles').select('*'),
    ]).then(([eventResult, profileResult]) => {
      if (eventResult.error || profileResult.error) {
        setDataError('Não foi possível carregar os compromissos.')
      } else {
        setEvents((eventResult.data || []).map((row) => ({
          ...row,
          responsibleId: row.responsible_id || '',
          completedAt: row.completed_at,
        })))
        setUsers(profileResult.data || [])
      }
      setLoading(false)
    })
  }, [])

  async function deleteEvent(id) {
    const { error: deleteError } = await supabase.from('events').delete().eq('id', id)
    if (deleteError) {
      setDataError('Não foi possível excluir o compromisso.')
      return
    }
    await reloadData()
  }

  if (loading) return <div className="grid gap-6"><Card><p className="py-6 text-center text-sm text-(--color-text-muted)">Carregando compromissos...</p></Card></div>
  if (dataError) return <div className="grid gap-6"><Card><p className="py-6 text-center text-sm font-semibold text-[#b42345]">{dataError}</p></Card></div>

  return <div className="grid gap-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-semibold text-(--color-primary)">Organização</p><h1 className="text-3xl font-bold text-(--color-text)">Agenda</h1><p className="mt-2 text-sm text-(--color-text-muted)">Seus compromissos e o histórico de finalizados.</p></div><div className="flex flex-wrap gap-2"><select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg border border-(--color-border) bg-white px-3 text-xs text-(--color-text-muted)"><option value="all">Todos responsáveis</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select><Button className="bg-(--color-primary) hover:bg-(--color-primary-hover)" onClick={() => { setForm(blank); setOpen(true) }}>+ Novo evento</Button></div></div><Card className="p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-(--color-text)">Próximos compromissos</h2><span className="text-xs text-(--color-text-muted)">{activeEvents.length} ativo(s)</span></div>{sortedEvents.length ? <div className="grid gap-3">{sortedEvents.map((item) => renderEvent(item))}</div> : <EmptyState title="Nenhum compromisso ativo" description="Adicione um evento para organizar a agenda da agência." actionLabel="Novo evento" onAction={() => setOpen(true)} />}</Card><Card className="p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-(--color-text)">Histórico de compromissos finalizados</h2><span className="text-xs text-(--color-text-muted)">{completedEvents.length} finalizado(s)</span></div>{sortedCompletedEvents.length ? <div className="grid gap-3">{sortedCompletedEvents.map((item) => renderEvent(item, true))}</div> : <p className="py-6 text-center text-sm text-(--color-text-muted)">Nenhum compromisso finalizado ainda.</p>}</Card><Modal open={open} title={form.id ? 'Editar evento' : 'Novo evento'} onClose={() => setOpen(false)} onConfirm={submit}><form onSubmit={submit} className="grid gap-4"><Input label="Título" name="title" value={form.title} onChange={change} placeholder="Nome do compromisso" /><div className="grid gap-4 sm:grid-cols-2"><Input label="Data" type="date" name="date" value={form.date} onChange={change} /><Input label="Horário" type="time" name="time" value={form.time} onChange={change} /></div><label className="grid gap-1.5 text-sm font-medium text-(--color-text-muted)">Responsável<select name="responsibleId" value={form.responsibleId || ''} onChange={change} className="rounded-lg border border-(--color-border) px-3 py-2.5 text-sm"><option value="">Sem responsável</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label><Input label="Descrição" name="description" value={form.description} onChange={change} placeholder="Detalhes opcionais" /></form></Modal></div>
}
