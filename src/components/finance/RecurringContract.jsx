import { useState } from 'react'
import { CurrencyInput } from '../ui/CurrencyInput'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { isOverdue, todayIso, getPeriod } from '../../services/financeUtils'

const emptyForm = { value: '', dueDate: '' }

export function RecurringContract({ clientId, contract, view = 'monthly', periodValue, onCreate, onUpdateContract, onUpdateOccurrence, onMarkPaid, onDelete, onError }) {
  const [form, setForm] = useState(emptyForm)
  const [paymentDates, setPaymentDates] = useState({})
  const occurrences = contract?.occurrences || []
  const period = getPeriod(view, periodValue)
  const visibleOccurrences = occurrences.filter((occurrence) => occurrence.dueDate >= period.start && occurrence.dueDate <= period.end)

  // Atualiza os dados do contrato recorrente no formulário.
  function change(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  function setValue(value) { setForm((current) => ({ ...current, value })) }

  async function perform(operation) {
    try {
      return (await operation()) !== false
    } catch (error) {
      onError?.(error.message || 'Não foi possível salvar os dados da recorrência.')
      return false
    }
  }

  // Mantém o valor mensal editável na própria recorrência, inclusive para adiantamentos.
  function updateRecurringValue(value) {
    perform(() => onUpdateContract(contract.id, { value: Number(value || 0) }))
  }

  // Atualiza o valor da competência sem alterar as demais competências do histórico.
  function updateOccurrenceValue(occurrence, value) {
    perform(() => onUpdateOccurrence(occurrence.id, { amount: Number(value || 0) }))
  }

  // Permite corrigir um pagamento marcado por engano e reabrir a competência.
  function updateOccurrenceStatus(occurrence, status) {
    if (status === 'Pago') return markPaid(occurrence)
    perform(() => onUpdateOccurrence(occurrence.id, { status, paymentDate: null }))
  }

  // Registra uma data real diferente de hoje para o pagamento da competência.
  function updatePaymentDate(occurrence, paymentDate) {
    perform(() => onUpdateOccurrence(occurrence.id, { paymentDate, status: paymentDate ? 'Pago' : 'Pendente' }))
  }

  // Cria a primeira competência mensal do contrato.
  async function create(event) {
    event.preventDefault()
    if (!form.value || !form.dueDate) return
    const saved = await perform(() => onCreate({
      clientId,
      value: Number(form.value),
      frequency: 'monthly',
      dueDay: Number(form.dueDate.slice(-2)),
      occurrence: {
        competence: form.dueDate.slice(0, 7),
        dueDate: form.dueDate,
        amount: Number(form.value),
        status: 'Pendente',
        paymentDate: null,
      },
    }))
    if (!saved) return
    setForm(emptyForm)
  }

  // Marca uma competência como paga e gera a próxima mensal automaticamente.
  async function markPaid(occurrence) {
    if (!contract) return
    const paymentDate = paymentDates[occurrence.id] || todayIso()
    await perform(() => onMarkPaid(contract, occurrence, paymentDate))
  }

  function formatCompetence(value) {
    if (!value) return ''
    const [year, month] = value.split('-').map(Number)
    if (!year || !month) return value
    const formatted = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return formatted.replace(' de ', '/').replace(/^./, (letter) => letter.toUpperCase())
  }

  function formatDate(value) {
    if (!value) return '—'
    const [year, month, day] = value.split('-').map(Number)
    if (!year || !month || !day) return value
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
  }

  function getStatusMeta(occurrence) {
    const overdue = isOverdue(occurrence)
    if (occurrence.status === 'Pago') return { label: 'Pago', icon: '✓', tone: 'success' }
    if (overdue) return { label: 'Atrasado', icon: '!', tone: 'danger' }
    return { label: 'Pendente', icon: '•', tone: 'warning' }
  }

  if (!contract) return <form onSubmit={create} className="mt-5 grid gap-3 rounded-lg bg-(--color-surface) p-4"><p className="text-xs font-bold uppercase tracking-wide text-(--color-text-muted)">Criar recorrência mensal</p><div className="grid gap-3 sm:grid-cols-2"><CurrencyInput label="Valor mensal" value={form.value} onChange={setValue} /><Input label="Primeiro vencimento" type="date" name="dueDate" value={form.dueDate} onChange={change} /></div><Button type="submit" className="justify-self-start bg-(--color-primary) hover:bg-(--color-primary-hover)">Cadastrar recorrência</Button></form>

  return <div className="mt-5 grid gap-3"><div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-(--color-border) bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"><div className="min-w-[220px]"><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-(--color-text-muted)">Recorrência mensal</p><div className="max-w-[260px]"><CurrencyInput label="Valor mensal" value={contract.value} onChange={updateRecurringValue} /></div></div><button onClick={() => perform(() => onDelete(contract.id))} className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-[#b42345] transition-colors hover:bg-rose-100">Excluir recorrência</button></div><div className="grid gap-3">{visibleOccurrences.length ? visibleOccurrences.map((occurrence) => { const statusMeta = getStatusMeta(occurrence); const badgeClass = statusMeta.tone === 'success' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : statusMeta.tone === 'danger' ? 'border border-rose-200 bg-rose-50 text-rose-700' : 'border border-amber-200 bg-amber-50 text-amber-700'; return <div key={occurrence.id} className="overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-border) bg-(--color-surface) px-4 py-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-(--color-text-muted)">Competência</p><h3 className="mt-1 text-lg font-semibold text-(--color-text)">{formatCompetence(occurrence.competence)}</h3></div><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeClass}`}><span aria-hidden="true">{statusMeta.icon}</span>{statusMeta.label}</span></div><div className="grid gap-3 p-4 md:grid-cols-4"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-(--color-text-muted)">Valor</p><div className="mt-1.5"><CurrencyInput label="" value={occurrence.amount} onChange={(value) => updateOccurrenceValue(occurrence, value)} /></div></div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-(--color-text-muted)">Vencimento</p><div className="mt-1.5 rounded-lg border border-(--color-border) bg-(--color-surface) px-2.5 py-2 text-sm font-semibold text-(--color-text)">{formatDate(occurrence.dueDate)}</div></div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-(--color-text-muted)">Pago em</p>{occurrence.status === 'Pago' ? <label className="mt-1.5 grid gap-1.5"><input aria-label={`Data real do pagamento de ${occurrence.competence}`} type="date" value={occurrence.paymentDate || ''} onChange={(event) => updatePaymentDate(occurrence, event.target.value)} className="w-full rounded-lg border border-(--color-border) bg-white px-2.5 py-2 text-sm text-(--color-text) outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary-light)" /></label> : <div className="mt-1.5 rounded-lg border border-dashed border-(--color-border) bg-(--color-surface) px-2.5 py-2 text-sm text-(--color-text-muted)">—</div>}</div><div className="min-w-0"><label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-(--color-text-muted)">Status<select value={occurrence.status === 'Pago' ? 'Pago' : 'Pendente'} onChange={(event) => updateOccurrenceStatus(occurrence, event.target.value)} className="min-w-[130px] rounded-lg border border-(--color-border) bg-white px-2.5 py-2 text-sm font-medium text-(--color-text) outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary-light)"><option>Pendente</option><option>Pago</option></select></label>{occurrence.status !== 'Pago' && <div className="mt-2 grid gap-2"><input aria-label={`Data do pagamento de ${occurrence.competence}`} type="date" value={paymentDates[occurrence.id] || todayIso()} onChange={(event) => setPaymentDates((current) => ({ ...current, [occurrence.id]: event.target.value }))} className="w-full rounded-lg border border-(--color-border) bg-white px-2.5 py-2 text-sm text-(--color-text) outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary-light)" /><button onClick={() => markPaid(occurrence)} className="justify-self-start rounded-full bg-(--color-primary) px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-(--color-primary-hover)">Registrar pagamento</button></div>}</div></div></div> }) : <p className="rounded-2xl border border-(--color-border) bg-(--color-surface) px-3 py-4 text-xs text-(--color-text-muted)">Nenhuma recorrência neste período.</p>}</div></div>
}
