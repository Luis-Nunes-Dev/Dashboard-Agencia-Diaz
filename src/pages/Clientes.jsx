import { useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'

const initialForm = { name: '', segment: '', email: '' }

export function Clientes() {
  const { clients, addEntity, deleteEntity } = useAppData()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')

  // Atualiza os campos controlados do formulário de cliente.
  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  // Valida e salva o cliente no contexto, que também persiste no localStorage.
  function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.email.includes('@')) return setError('Informe nome e e-mail válidos.')
    addEntity('clients', { ...form, initials: form.name.slice(0, 2).toUpperCase() })
    setForm(initialForm)
    setError('')
    setOpen(false)
  }

  return <div className="grid gap-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-semibold text-[#7138ef]">Relacionamentos</p><h1 className="text-3xl font-bold text-[#171b32]">Clientes</h1><p className="mt-2 text-sm text-[#737b91]">Gerencie a carteira da sua agência.</p></div><Button className="bg-[#7138ef] hover:bg-[#5f27d4]" onClick={() => setOpen(true)}>+ Adicionar cliente</Button></div><Card>{clients.length ? <div className="overflow-x-auto"><table className="w-full min-w-150 text-left text-sm"><thead><tr className="border-b border-[#edf1ee] text-[10px] uppercase tracking-[0.08em] text-[#9299ad]"><th className="px-5 py-3">Cliente</th><th className="px-5 py-3">Segmento</th><th className="px-5 py-3">E-mail</th><th className="px-5 py-3">Ações</th></tr></thead><tbody>{clients.map((client) => <tr key={client.id} className="border-b border-[#f0f1f6] last:border-0"><td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar initials={client.initials} /><span className="font-semibold text-[#30374e]">{client.name}</span></div></td><td className="px-5 py-4 text-[#606981]">{client.segment || 'Sem segmento'}</td><td className="px-5 py-4 text-[#606981]">{client.email}</td><td className="px-5 py-4"><button className="text-xs font-semibold text-[#b42345]" onClick={() => deleteEntity('clients', client.id)}>Excluir</button></td></tr>)}</tbody></table></div> : <EmptyState title="Nenhum cliente cadastrado ainda" description="Adicione seu primeiro cliente para começar a organizar a agência." actionLabel="Adicionar cliente" onAction={() => setOpen(true)} />}</Card><Modal open={open} title="Novo cliente" onClose={() => setOpen(false)} onConfirm={handleSubmit}><form className="grid gap-4" onSubmit={handleSubmit}><Input label="Nome da empresa" name="name" value={form.name} onChange={handleChange} placeholder="Nome do cliente" /><Input label="Segmento" name="segment" value={form.segment} onChange={handleChange} placeholder="Segmento de atuação" /><Input label="E-mail" name="email" type="email" value={form.email} onChange={handleChange} placeholder="contato@empresa.com" />{error && <p className="text-xs font-semibold text-[#b42345]">{error}</p>}</form></Modal></div>
}
