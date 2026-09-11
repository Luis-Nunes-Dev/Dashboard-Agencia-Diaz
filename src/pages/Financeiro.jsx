import { useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { getFinancialTotals } from '../services/financeUtils'
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
  const { clients, clientContracts, recurringContracts, services, addEntity, updateEntity, deleteEntity } = useAppData()
  const [tab, setTab] = useState('clients')
  const [serviceOpen, setServiceOpen] = useState(false)
  const [form, setForm] = useState(blankService)
  const currentDate = new Date()
  const [periodView, setPeriodView] = useState('monthly')
  const [periodValue, setPeriodValue] = useState(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`)

  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function setServiceValue(value) {
    setForm((current) => ({ ...current, totalValue: value }))
  }

  function submitService(event) {
    event.preventDefault()
    if (!form.description.trim() || !form.totalValue) return
    addEntity('services', { ...form, totalValue: Number(form.totalValue), payments: [], status: 'Ativo', finalizedAt: null })
    setForm(blankService)
    setServiceOpen(false)
  }

  function saveContract(clientId, values) {
    const contract = clientContracts.find((item) => item.clientId === clientId)
    if (contract) updateEntity('clientContracts', contract.id, values)
    else addEntity('clientContracts', { clientId, totalValue: 0, payments: [], ...values })
  }

  function updatePayments(clientId, payments) {
    saveContract(clientId, { payments })
  }

  function updateServicePayments(serviceId, payments) {
    updateEntity('services', serviceId, { payments })
  }

  function finalizeService(id) {
    updateEntity('services', id, { status: 'Finalizado', finalizedAt: new Date().toISOString() })
  }

  const activeServices = services.filter((service) => service.status !== 'Finalizado')
  const finishedServices = services.filter((service) => service.status === 'Finalizado')
  const selectedPeriod = getPeriod(periodView, periodValue)
  const isInPeriod = (date) => Boolean(date && date >= selectedPeriod.start && date <= selectedPeriod.end)

  return <div className="grid gap-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="mb-2 text-sm font-semibold text-(--color-primary)">Gestão financeira</p><h1 className="text-3xl font-bold text-(--color-text)">Financeiro</h1><p className="mt-2 text-sm text-(--color-text-muted)">Contratos recorrentes, recebimentos e serviços.</p></div>
      <Button className="bg-(--color-primary) hover:bg-(--color-primary-hover)" onClick={() => setServiceOpen(true)}>+ Novo serviço</Button>
    </div>
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
        <RecurringContract clientId={client.id} contract={recurring} view={periodView} periodValue={selectedPeriod.value} />
        <div className="mt-5"><PaymentHistory payments={contract?.payments || []} onChange={(payments) => updatePayments(client.id, payments)} allowRecurringAdvance /></div>
        {linkedServices.length > 0 && <ClientServicesHistory services={linkedServices} />}
      </Card>
    }) : <Card><EmptyState title="Nenhum cliente cadastrado" description="Cadastre clientes para controlar contratos e recorrências." actionLabel="Ir para clientes" onAction={() => window.location.assign('/clientes')} /></Card>}</section>}
    {tab === 'services' && <section className="grid gap-4">{activeServices.length ? activeServices.map((service) => <ServiceCard key={service.id} service={service} clients={clients} onPayments={updateServicePayments} onFinalize={finalizeService} onDelete={deleteEntity} />) : <Card><EmptyState title="Nenhum serviço ativo" description="Cadastre um serviço avulso ou vinculado a cliente." actionLabel="Novo serviço" onAction={() => setServiceOpen(true)} /></Card>}</section>}
    {tab === 'history' && <section className="grid gap-4">{finishedServices.length ? finishedServices.map((service) => <ServiceCard key={service.id} service={service} clients={clients} onPayments={updateServicePayments} onDelete={deleteEntity} />) : <Card><EmptyState title="Nenhum serviço finalizado" description="Serviços finalizados continuarão disponíveis neste histórico." /></Card>}</section>}
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
  return <Card className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-(--color-text)">{service.description}</h2><p className="mt-1 text-xs text-(--color-text-muted)">{client?.name || 'Serviço avulso'} · {service.status || 'Ativo'}</p>{service.finalizedAt && <p className="mt-1 text-xs text-(--color-text-muted)">Finalizado em {service.finalizedAt.slice(0, 10)}</p>}</div><div className="flex items-center gap-4 text-right text-xs"><span><small className="block text-(--color-text-muted)">Total</small><strong className="mt-1 block text-sm text-(--color-text)">{money(service.totalValue)}</strong></span><span><small className="block text-(--color-text-muted)">Pago</small><strong className="mt-1 block text-sm text-(--color-primary)">{money(totals.paid)}</strong></span><span><small className="block text-(--color-text-muted)">Saldo</small><strong className="mt-1 block text-sm text-(--color-text)">{money(totals.due)}</strong></span>{service.status !== 'Finalizado' && <button onClick={() => onFinalize(service.id)} className="font-semibold text-(--color-primary)">Finalizar serviço</button>}<button onClick={() => onDelete('services', service.id)} className="text-[#b42345]">Excluir</button></div></div><div className="mt-5"><PaymentHistory payments={service.payments} onChange={(payments) => onPayments(service.id, payments)} /></div></Card>
}
