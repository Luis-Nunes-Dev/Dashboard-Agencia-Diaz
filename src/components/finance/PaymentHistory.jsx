import { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

const blank = { value: '', date: '', observation: '', isRecurringAdvance: false }

// Centraliza o CRUD do histórico para contratos de clientes e serviços.
export function PaymentHistory({ payments = [], onChange, allowRecurringAdvance = false }) {
  const [form, setForm] = useState(blank)
  const [editingId, setEditingId] = useState(null)

  // Atualiza os campos do pagamento em edição.
  function change(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  // Adiciona ou atualiza o pagamento e devolve a coleção ao Financeiro.
  async function submit(event) {
    event.preventDefault()
    if (!form.value || !form.date) return
    const payment = {
      ...(editingId ? { id: editingId } : {}),
      value: Number(form.value),
      date: form.date,
      observation: form.observation || '',
      isRecurringAdvance: allowRecurringAdvance && Boolean(form.isRecurringAdvance),
    }
    const nextPayments = editingId
      ? payments.map((item) => item.id === editingId ? payment : item)
      : [...payments, payment]
    if (await onChange(nextPayments) === false) return
    setForm(blank)
    setEditingId(null)
  }
  function edit(payment) { setEditingId(payment.id); setForm({ ...payment, isRecurringAdvance: Boolean(payment.isRecurringAdvance) }) }
  async function remove(id) {
    await onChange(payments.filter((payment) => payment.id !== id))
  }

  return <div className="grid gap-3"><p className="text-xs font-bold uppercase tracking-wide text-(--color-text-muted)">Histórico de pagamentos</p>{payments.length ? <div className="divide-y divide-(--color-border) rounded-lg border border-(--color-border)">{payments.map((payment) => { const scheduled = payment.date > new Date().toISOString().slice(0, 10); return <div key={payment.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-xs"><span className="w-24 text-(--color-text-muted)">{payment.date}</span><strong className={scheduled ? 'text-(--color-text-muted)' : 'text-(--color-primary)'}>R$ {Number(payment.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>{scheduled && <span className="rounded-full bg-(--color-primary-light) px-2 py-0.5 text-[10px] font-semibold text-(--color-primary)">Agendado</span>}{payment.isRecurringAdvance && <span className="rounded-full bg-(--color-primary-light) px-2 py-0.5 text-[10px] font-semibold text-(--color-primary)">Adiantamento</span>}<span className="min-w-32 flex-1 text-(--color-text-muted)">{payment.observation || 'Sem observação'}</span><button onClick={() => edit(payment)} className="text-(--color-primary)">Editar</button><button onClick={() => remove(payment.id)} className="text-[#b42345]">Excluir</button></div> })}</div> : <p className="text-xs text-(--color-text-muted)">Nenhum pagamento registrado.</p>}<form onSubmit={submit} className="grid gap-2 rounded-lg bg-(--color-surface) p-3 sm:grid-cols-[1fr_1fr_1.5fr_auto]"><Input label="Valor" type="number" min="0" step="0.01" name="value" value={form.value} onChange={change} placeholder="0,00" /><Input label="Data" type="date" name="date" value={form.date} onChange={change} /><Input label="Observação" name="observation" value={form.observation} onChange={change} placeholder="Opcional" />{allowRecurringAdvance && <label className="flex items-center gap-2 text-xs text-(--color-text-muted)"><input type="checkbox" name="isRecurringAdvance" checked={Boolean(form.isRecurringAdvance)} onChange={(event) => setForm((current) => ({ ...current, isRecurringAdvance: event.target.checked }))} className="accent-(--color-primary)" />Adiantamento da recorrência</label>}<Button type="submit" className="self-end bg-(--color-primary) hover:bg-(--color-primary-hover)">{editingId ? 'Atualizar' : 'Adicionar'}</Button></form></div>
}

