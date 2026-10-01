import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { addMonth, getFinancialTotals } from '../services/financeUtils'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { PaymentHistory } from '../components/finance/PaymentHistory'
import { RecurringContract } from '../components/finance/RecurringContract'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import { getPeriod, getFinancialPeriodSummary } from '../services/financeUtils'

const blankService = { description: '', totalValue: '', type: 'avulso', clientId: '' }

function money(value) {
  return `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

export function Financeiro() {
  const [clients, setClients] = useState([])
  const [clientContracts, setClientContracts] = useState([])
  const [recurringContracts, setRecurringContracts] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [operationError, setOperationError] = useState('')
  const [tab, setTab] = useState('clients')
  const [serviceOpen, setServiceOpen] = useState(false)
  const [form, setForm] = useState(blankService)
  const currentDate = new Date()
  const [periodView, setPeriodView] = useState('monthly')
  const [periodValue, setPeriodValue] = useState(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`)

  const loadFinancialData = useCallback(async () => {
    try {
      const [clientsResult, contractsResult, recurringResult, occurrencesResult, servicesResult, paymentsResult] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('client_contracts').select('*').order('created_at', { ascending: true }),
        supabase.from('recurring_contracts').select('*').order('created_at', { ascending: true }),
        supabase.from('recurring_occurrences').select('*').order('due_date', { ascending: true }),
        supabase.from('services').select('*').order('created_at', { ascending: true }),
        supabase.from('payments').select('*').order('created_at', { ascending: true }),
      ])
      const queryError = [clientsResult, contractsResult, recurringResult, occurrencesResult, servicesResult, paymentsResult]
        .find((result) => result.error)?.error

      if (queryError) {
        setLoadError(queryError.message || 'Não foi possível carregar os dados financeiros.')
        setLoading(false)
        return false
      }

      const paymentsByContract = new Map()
      const paymentsByService = new Map()
      for (const row of paymentsResult.data || []) {
        const payment = {
          id: row.id,
          value: Number(row.value || 0),
          date: row.date,
          observation: row.observation || '',
          isRecurringAdvance: Boolean(row.is_recurring_advance),
        }
        if (row.client_contract_id) {
          const payments = paymentsByContract.get(row.client_contract_id) || []
          payments.push(payment)
          paymentsByContract.set(row.client_contract_id, payments)
        }
        if (row.service_id) {
          const payments = paymentsByService.get(row.service_id) || []
          payments.push(payment)
          paymentsByService.set(row.service_id, payments)
        }
      }

      const occurrencesByContract = new Map()
      for (const row of occurrencesResult.data || []) {
        const occurrences = occurrencesByContract.get(row.recurring_contract_id) || []
        occurrences.push({
          id: row.id,
          recurringContractId: row.recurring_contract_id,
          competence: row.competence,
          dueDate: row.due_date,
          amount: Number(row.amount || 0),
          status: row.status,
          paymentDate: row.payment_date,
          createdAt: row.created_at,
        })
        occurrencesByContract.set(row.recurring_contract_id, occurrences)
      }

      setClients(clientsResult.data || [])
      setClientContracts((contractsResult.data || []).map((row) => ({
        id: row.id,
        clientId: row.client_id,
        totalValue: Number(row.total_value || 0),
        dueDate: row.due_date,
        createdAt: row.created_at,
        payments: paymentsByContract.get(row.id) || [],
      })))
      setRecurringContracts((recurringResult.data || []).map((row) => ({
        id: row.id,
        clientId: row.client_id,
        value: Number(row.value || 0),
        frequency: row.frequency,
        dueDay: Number(row.due_day),
        createdAt: row.created_at,
        occurrences: occurrencesByContract.get(row.id) || [],
      })))
      setServices((servicesResult.data || []).map((row) => ({
        id: row.id,
        clientId: row.client_id,
        description: row.description,
        totalValue: Number(row.total_value || 0),
        type: row.type,
        status: row.status,
        finalizedAt: row.finalized_at,
        createdAt: row.created_at,
        payments: paymentsByService.get(row.id) || [],
      })))
      setLoadError('')
      setLoading(false)
      return true
    } catch (error) {
      setLoadError(error.message || 'Não foi possível carregar os dados financeiros.')
      setLoading(false)
      return false
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(loadFinancialData)
  }, [loadFinancialData])

  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function setServiceValue(value) {
    setForm((current) => ({ ...current, totalValue: value }))
  }

  async function submitService(event) {
    event.preventDefault()
    if (!form.description.trim() || !form.totalValue) return
    setOperationError('')
    const { error: insertError } = await supabase.from('services').insert({
      description: form.description.trim(),
      total_value: Number(form.totalValue),
      type: form.type,
      client_id: form.type === 'cliente' ? form.clientId || null : null,
      status: 'Ativo',
      finalized_at: null,
    })
    if (insertError) {
      setOperationError(insertError.message || 'Não foi possível criar o serviço.')
      return
    }
    if (!await loadFinancialData()) return
    setForm(blankService)
    setServiceOpen(false)
  }

  async function getOrCreateClientContract(clientId) {
    const existing = clientContracts.find((item) => item.clientId === clientId)
    if (existing) return existing.id
    const { data, error: insertError } = await supabase
      .from('client_contracts')
      .insert({ client_id: clientId, total_value: 0, due_date: null })
      .select('id')
      .single()
    if (insertError) throw insertError
    return data.id
  }

  async function updatePayments(ownerType, ownerId, nextPayments) {
    setOperationError('')
    let contractId = null
    try {
      if (ownerType === 'client') contractId = await getOrCreateClientContract(ownerId)
      const currentPayments = ownerType === 'client'
        ? clientContracts.find((item) => item.id === contractId)?.payments || []
        : services.find((item) => item.id === ownerId)?.payments || []
      const nextIds = new Set(nextPayments.filter((payment) => payment.id).map((payment) => payment.id))

      for (const payment of currentPayments) {
        if (!nextIds.has(payment.id)) {
          const { error: deleteError } = await supabase.from('payments').delete().eq('id', payment.id)
          if (deleteError) throw deleteError
        }
      }

      for (const payment of nextPayments) {
        const values = {
          value: Number(payment.value || 0),
          date: payment.date,
          observation: payment.observation || '',
          is_recurring_advance: ownerType === 'client' && Boolean(payment.isRecurringAdvance),
        }
        if (payment.id) {
          const previous = currentPayments.find((item) => item.id === payment.id)
          if (previous && previous.value === values.value && previous.date === values.date && previous.observation === values.observation && previous.isRecurringAdvance === values.is_recurring_advance) continue
          const { error: updateError } = await supabase.from('payments').update(values).eq('id', payment.id)
          if (updateError) throw updateError
        } else {
          const { error: insertError } = await supabase.from('payments').insert({
            ...values,
            client_contract_id: ownerType === 'client' ? contractId : null,
            service_id: ownerType === 'service' ? ownerId : null,
            recurring_occurrence_id: null,
          })
          if (insertError) throw insertError
        }
      }

      if (!await loadFinancialData()) return false
      return true
    } catch (error) {
      setOperationError(error.message || 'Não foi possível atualizar o histórico de pagamentos.')
      await loadFinancialData()
      return false
    }
  }

  async function createRecurringContract(clientId, values) {
    setOperationError('')
    const { data: contract, error: contractError } = await supabase
      .from('recurring_contracts')
      .insert({ client_id: clientId, value: values.value, frequency: values.frequency, due_day: values.dueDay })
      .select('id')
      .single()
    if (contractError) {
      setOperationError(contractError.message || 'Não foi possível criar a recorrência.')
      return false
    }

    const { error: occurrenceError } = await supabase.from('recurring_occurrences').insert({
      recurring_contract_id: contract.id,
      competence: values.occurrence.competence,
      due_date: values.occurrence.dueDate,
      amount: values.occurrence.amount,
      status: values.occurrence.status,
      payment_date: values.occurrence.paymentDate,
    })
    if (occurrenceError) {
      const { error: rollbackError } = await supabase.from('recurring_contracts').delete().eq('id', contract.id)
      setOperationError(rollbackError
        ? `${occurrenceError.message} Não foi possível remover o contrato criado: ${rollbackError.message}`
        : occurrenceError.message || 'Não foi possível criar a primeira ocorrência.')
      return false
    }

    return loadFinancialData()
  }

  async function updateRecurringContract(id, values) {
    setOperationError('')
    const { error: updateError } = await supabase.from('recurring_contracts').update({ value: values.value }).eq('id', id)
    if (updateError) {
      setOperationError(updateError.message || 'Não foi possível atualizar a recorrência.')
      return false
    }
    return loadFinancialData()
  }

  async function updateOccurrence(id, values) {
    setOperationError('')
    const payload = {}
    if (Object.hasOwn(values, 'amount')) payload.amount = values.amount
    if (Object.hasOwn(values, 'status')) payload.status = values.status
    if (Object.hasOwn(values, 'paymentDate')) payload.payment_date = values.paymentDate
    const { error: updateError } = await supabase.from('recurring_occurrences').update(payload).eq('id', id)
    if (updateError) {
      setOperationError(updateError.message || 'Não foi possível atualizar a ocorrência.')
      return false
    }
    return loadFinancialData()
  }

  async function markOccurrencePaid(contract, occurrence, paymentDate) {
    setOperationError('')
    const { error: updateError } = await supabase.from('recurring_occurrences')
      .update({ status: 'Pago', payment_date: paymentDate })
      .eq('id', occurrence.id)
    if (updateError) {
      setOperationError(updateError.message || 'Não foi possível registrar o pagamento.')
      return false
    }

    const nextDate = addMonth(occurrence.dueDate, contract.dueDay)
    const { data: existingNext, error: queryError } = await supabase.from('recurring_occurrences')
      .select('id')
      .eq('recurring_contract_id', contract.id)
      .eq('due_date', nextDate)
      .maybeSingle()
    if (queryError) {
      setOperationError(queryError.message || 'Não foi possível verificar a próxima ocorrência.')
      await loadFinancialData()
      return false
    }
    if (!existingNext) {
      const { error: insertError } = await supabase.from('recurring_occurrences').insert({
        recurring_contract_id: contract.id,
        competence: nextDate.slice(0, 7),
        due_date: nextDate,
        amount: occurrence.amount,
        status: 'Pendente',
        payment_date: null,
      })
      if (insertError) {
        setOperationError(insertError.message || 'Pagamento registrado, mas não foi possível criar a próxima ocorrência.')
        await loadFinancialData()
        return false
      }
    }
    return loadFinancialData()
  }

  async function deleteRecurringContract(id) {
    setOperationError('')
    const { data: occurrences, error: queryError } = await supabase.from('recurring_occurrences')
      .select('id')
      .eq('recurring_contract_id', id)
    if (queryError) {
      setOperationError(queryError.message || 'Não foi possível carregar as ocorrências da recorrência.')
      return false
    }
    const occurrenceIds = (occurrences || []).map((occurrence) => occurrence.id)
    if (occurrenceIds.length) {
      const { error: paymentsError } = await supabase.from('payments')
        .delete()
        .in('recurring_occurrence_id', occurrenceIds)
      if (paymentsError) {
        setOperationError(paymentsError.message || 'Não foi possível excluir os pagamentos das ocorrências.')
        return false
      }
    }
    const { error: occurrencesError } = await supabase.from('recurring_occurrences').delete().eq('recurring_contract_id', id)
    if (occurrencesError) {
      setOperationError(occurrencesError.message || 'Não foi possível excluir as ocorrências da recorrência.')
      await loadFinancialData()
      return false
    }
    const { error: contractError } = await supabase.from('recurring_contracts').delete().eq('id', id)
    if (contractError) {
      setOperationError(contractError.message || 'Não foi possível excluir a recorrência.')
      await loadFinancialData()
      return false
    }
    return loadFinancialData()
  }

  async function finalizeService(id) {
    setOperationError('')
    const { error: updateError } = await supabase.from('services').update({
      status: 'Finalizado',
      finalized_at: new Date().toISOString(),
    }).eq('id', id)
    if (updateError) {
      setOperationError(updateError.message || 'Não foi possível finalizar o serviço.')
      return false
    }
    return loadFinancialData()
  }

  async function deleteService(_entity, id) {
    setOperationError('')
    const { error: paymentsError } = await supabase.from('payments').delete().eq('service_id', id)
    if (paymentsError) {
      setOperationError(paymentsError.message || 'Não foi possível excluir os pagamentos do serviço.')
      return false
    }
    const { error: deleteError } = await supabase.from('services').delete().eq('id', id)
    if (deleteError) {
      setOperationError(deleteError.message || 'Não foi possível excluir o serviço.')
      await loadFinancialData()
      return false
    }
    return loadFinancialData()
  }

  const activeServices = services.filter((service) => service.status !== 'Finalizado')
  const finishedServices = services.filter((service) => service.status === 'Finalizado')
  const selectedPeriod = getPeriod(periodView, periodValue)
  const isInPeriod = (date) => Boolean(date && date >= selectedPeriod.start && date <= selectedPeriod.end)

  if (loading) return <div className="grid gap-6"><Card><p className="py-6 text-center text-sm text-(--color-text-muted)">Carregando dados financeiros...</p></Card></div>
  if (loadError) return <div className="grid gap-6"><Card><p className="py-6 text-center text-sm font-semibold text-[#b42345]">{loadError}</p></Card></div>

  return <div className="grid gap-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="mb-2 text-sm font-semibold text-(--color-primary)">Gestão financeira</p><h1 className="text-3xl font-bold text-(--color-text)">Financeiro</h1><p className="mt-2 text-sm text-(--color-text-muted)">Contratos recorrentes, recebimentos e serviços.</p></div>
      <Button className="bg-(--color-primary) hover:bg-(--color-primary-hover)" onClick={() => setServiceOpen(true)}>+ Novo serviço</Button>
    </div>
    {operationError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-[#b42345]">{operationError}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-1 rounded-lg bg-(--color-primary-light) p-1">
      <button onClick={() => setTab('clients')} className={`rounded-md px-4 py-2 text-sm font-semibold ${tab === 'clients' ? 'bg-white text-(--color-primary) shadow-sm' : 'text-(--color-text-muted)'}`}>Por cliente</button>
      <button onClick={() => setTab('services')} className={`rounded-md px-4 py-2 text-sm font-semibold ${tab === 'services' ? 'bg-white text-(--color-primary) shadow-sm' : 'text-(--color-text-muted)'}`}>Serviços realizados</button>
      <button onClick={() => setTab('history')} className={`rounded-md px-4 py-2 text-sm font-semibold ${tab === 'history' ? 'bg-white text-(--color-primary) shadow-sm' : 'text-(--color-text-muted)'}`}>Histórico</button>
    </div><div className="flex items-center gap-2"><div className="flex rounded-lg bg-(--color-primary-light) p-1"><button onClick={() => { setPeriodView('monthly'); setPeriodValue(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`) }} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${periodView === 'monthly' ? 'bg-white text-(--color-primary) shadow-sm' : 'text-(--color-text-muted)'}`}>Mensal</button><button onClick={() => { setPeriodView('annual'); setPeriodValue(String(currentDate.getFullYear())) }} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${periodView === 'annual' ? 'bg-white text-(--color-primary) shadow-sm' : 'text-(--color-text-muted)'}`}>Anual</button></div>{periodView === 'monthly' ? <input aria-label="Mês financeiro" type="month" value={periodValue} onChange={(event) => setPeriodValue(event.target.value)} className="rounded-lg border border-(--color-border) bg-white px-3 py-2 text-xs" /> : <input aria-label="Ano financeiro" type="number" value={periodValue} onChange={(event) => setPeriodValue(event.target.value)} className="w-24 rounded-lg border border-(--color-border) bg-white px-3 py-2 text-xs" />}</div></div>
    {tab === 'clients' && <section className="grid gap-4">{clients.length ? clients.map((client) => {
      const contract = clientContracts.find((item) => item.clientId === client.id) || null
      const linkedServices = services.filter((service) => service.clientId === client.id)
      const recurring = recurringContracts.find((item) => item.clientId === client.id)
      const selectedOccurrences = (recurring?.occurrences || []).filter((occurrence) => isInPeriod(occurrence.dueDate))
      const recurringValue = selectedOccurrences.reduce((sum, occurrence) => sum + Number(occurrence.amount || 0), 0)
      const servicesValue = linkedServices.reduce((sum, service) => sum + Number(service.totalValue || 0), 0)
      const clientSummary = getFinancialPeriodSummary({ clientContracts: contract ? [contract] : [], services: linkedServices, recurringContracts: recurring ? [recurring] : [], view: periodView, periodValue: selectedPeriod.value })
      const paidValue = clientSummary.totals.paid
      const totalValue = recurringValue + servicesValue
      const receivedValue = clientSummary.totals.receivable
      return <Card key={client.id} className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-(--color-text)">{client.name}</h2><p className="mt-1 text-xs text-(--color-text-muted)">Recorrência e serviços</p></div><div className="grid grid-cols-3 gap-4 text-right text-xs"><span><small className="block text-(--color-text-muted)">Valor total</small><strong className="mt-1 block text-sm text-(--color-text)">{money(totalValue)}</strong></span><span><small className="block text-(--color-text-muted)">Valor pago</small><strong className="mt-1 block text-sm text-(--color-primary)">{money(paidValue)}</strong></span><span><small className="block text-(--color-text-muted)">A receber</small><strong className="mt-1 block text-sm text-(--color-text)">{money(receivedValue)}</strong></span></div></div>
        <RecurringContract clientId={client.id} contract={recurring} view={periodView} periodValue={selectedPeriod.value} onCreate={createRecurringContract} onUpdateContract={updateRecurringContract} onUpdateOccurrence={updateOccurrence} onMarkPaid={markOccurrencePaid} onDelete={deleteRecurringContract} onError={setOperationError} />
        <div className="mt-5"><PaymentHistory payments={contract?.payments || []} onChange={(payments) => updatePayments('client', client.id, payments)} allowRecurringAdvance /></div>
        {linkedServices.length > 0 && <ClientServicesHistory services={linkedServices} />}
      </Card>
    }) : <Card><EmptyState title="Nenhum cliente cadastrado" description="Cadastre clientes para controlar contratos e recorrências." actionLabel="Ir para clientes" onAction={() => window.location.assign('/clientes')} /></Card>}</section>}
    {tab === 'services' && <section className="grid gap-4">{activeServices.length ? activeServices.map((service) => <ServiceCard key={service.id} service={service} clients={clients} onPayments={(payments) => updatePayments('service', service.id, payments)} onFinalize={finalizeService} onDelete={deleteService} />) : <Card><EmptyState title="Nenhum serviço ativo" description="Cadastre um serviço avulso ou vinculado a cliente." actionLabel="Novo serviço" onAction={() => setServiceOpen(true)} /></Card>}</section>}
    {tab === 'history' && <section className="grid gap-4">{finishedServices.length ? finishedServices.map((service) => <ServiceCard key={service.id} service={service} clients={clients} onPayments={(payments) => updatePayments('service', service.id, payments)} onDelete={deleteService} />) : <Card><EmptyState title="Nenhum serviço finalizado" description="Serviços finalizados continuarão disponíveis neste histórico." /></Card>}</section>}
    <Modal open={serviceOpen} title="Novo serviço" onClose={() => setServiceOpen(false)} onConfirm={submitService}><form onSubmit={submitService} className="grid gap-4"><Input label="Descrição" name="description" value={form.description} onChange={change} placeholder="Descrição do serviço" /><CurrencyInput label="Valor total" value={form.totalValue} onChange={setServiceValue} /><label className="grid gap-1.5 text-sm font-medium text-(--color-text-muted)">Tipo<select name="type" value={form.type} onChange={change} className="rounded-lg border border-(--color-border) px-3 py-2.5 text-sm"><option value="avulso">Avulso</option><option value="cliente">Vinculado a cliente</option></select></label>{form.type === 'cliente' && <label className="grid gap-1.5 text-sm font-medium text-(--color-text-muted)">Cliente<select name="clientId" value={form.clientId} onChange={change} className="rounded-lg border border-(--color-border) px-3 py-2.5 text-sm"><option value="">Selecione</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>}</form></Modal>
  </div>
}

function ClientServicesHistory({ services }) {
  return <div className="mt-5 border-t border-(--color-border) pt-4"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-(--color-text-muted)">Serviços deste cliente</p><div className="grid gap-2">{services.map((service) => { const totals = getFinancialTotals(service); return <div key={service.id} className="rounded-lg bg-(--color-surface) px-3 py-2.5 text-xs"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-(--color-text)">{service.description}</span><span className="text-(--color-text-muted)">{service.status}</span></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-(--color-text-muted)"><span>Valor: <strong className="text-(--color-text)">{formatMoney(service.totalValue)}</strong></span><span>Pago: <strong className="text-(--color-primary)">{formatMoney(totals.paid)}</strong></span><span>Faltante: <strong className={totals.due > 0 ? 'text-[#b45309]' : 'text-(--color-primary)'}>{formatMoney(totals.due)}</strong></span></div>{service.finalizedAt && <p className="mt-2 text-[10px] text-(--color-text-muted)">Finalizado em {service.finalizedAt.slice(0, 10)}</p>}</div> })}</div></div>
}

function formatMoney(value) {
  return `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function ServiceCard({ service, clients, onPayments, onFinalize, onDelete }) {
  const totals = getFinancialTotals(service)
  const client = clients.find((item) => item.id === service.clientId)
  return <Card className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-(--color-text)">{service.description}</h2><p className="mt-1 text-xs text-(--color-text-muted)">{client?.name || 'Serviço avulso'} · {service.status || 'Ativo'}</p>{service.finalizedAt && <p className="mt-1 text-xs text-(--color-text-muted)">Finalizado em {service.finalizedAt.slice(0, 10)}</p>}</div><div className="flex items-center gap-4 text-right text-xs"><span><small className="block text-(--color-text-muted)">Total</small><strong className="mt-1 block text-sm text-(--color-text)">{money(service.totalValue)}</strong></span><span><small className="block text-(--color-text-muted)">Pago</small><strong className="mt-1 block text-sm text-(--color-primary)">{money(totals.paid)}</strong></span><span><small className="block text-(--color-text-muted)">Saldo a receber</small><strong className="mt-1 block text-sm text-(--color-text)">{money(totals.due)}</strong></span>{service.status !== 'Finalizado' && <button onClick={() => onFinalize(service.id)} className="font-semibold text-(--color-primary)">Finalizar serviço</button>}<button onClick={() => onDelete('services', service.id)} className="text-[#b42345]">Excluir</button></div></div><div className="mt-5"><PaymentHistory payments={service.payments} onChange={(payments) => onPayments(payments)} /></div></Card>
}
