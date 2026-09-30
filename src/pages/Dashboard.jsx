import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getFinancialPeriodSummary } from '../services/financeUtils'
import { MetricCard } from '../components/dashboard/MetricCard'
import { ProjectTable } from '../components/dashboard/ProjectTable'
import { PerformanceChart } from '../components/dashboard/PerformanceChart'
import { AttentionList } from '../components/dashboard/AttentionList'
import { UpcomingCommitments } from '../components/dashboard/UpcomingCommitments'
import { Button } from '../components/ui/Button'

export function Dashboard() {
  const [clients, setClients] = useState([])
  const [demands, setDemands] = useState([])
  const [events, setEvents] = useState([])
  const [transactions, setTransactions] = useState([])
  const [clientContracts, setClientContracts] = useState([])
  const [recurringContracts, setRecurringContracts] = useState([])
  const [services, setServices] = useState([])
  const [financialLoading, setFinancialLoading] = useState(true)
  const [financialError, setFinancialError] = useState('')
  const [operationalLoading, setOperationalLoading] = useState(true)
  const [operationalError, setOperationalError] = useState('')
  const now = new Date()
  const [view, setView] = useState('monthly')
  const [periodValue, setPeriodValue] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

  useEffect(() => {
    let active = true

    Promise.all([
      supabase.from('demands')
        .select('id, client_id, title, status, due_date')
        .order('created_at', { ascending: true }),
      supabase.from('events')
        .select('id, title, date, time, description')
        .order('created_at', { ascending: true }),
    ]).then(([demandsResult, eventsResult]) => {
      if (!active) return
      const queryError = [demandsResult, eventsResult].find((result) => result.error)?.error
      if (queryError) {
        setOperationalError(queryError.message || 'Não foi possível carregar demandas e eventos.')
      } else {
        setDemands((demandsResult.data || []).map((row) => ({
          id: row.id,
          clientId: row.client_id,
          title: row.title,
          status: row.status,
          dueDate: row.due_date,
        })))
        setEvents((eventsResult.data || []).map((row) => ({
          id: row.id,
          title: row.title,
          date: row.date,
          time: row.time,
          description: row.description,
        })))
      }
      setOperationalLoading(false)
    }).catch((error) => {
      if (!active) return
      setOperationalError(error.message || 'Não foi possível carregar demandas e eventos.')
      setOperationalLoading(false)
    })

    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true

    Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('client_contracts').select('*').order('created_at', { ascending: true }),
      supabase.from('recurring_contracts').select('*').order('created_at', { ascending: true }),
      supabase.from('recurring_occurrences').select('*').order('due_date', { ascending: true }),
      supabase.from('services').select('*').order('created_at', { ascending: true }),
      supabase.from('payments').select('*').order('created_at', { ascending: true }),
      supabase.from('transactions').select('*').order('created_at', { ascending: true }),
    ]).then(([clientsResult, contractsResult, recurringResult, occurrencesResult, servicesResult, paymentsResult, transactionsResult]) => {
      if (!active) return
      const queryError = [clientsResult, contractsResult, recurringResult, occurrencesResult, servicesResult, paymentsResult, transactionsResult]
        .find((result) => result.error)?.error
      if (queryError) {
        setFinancialError(queryError.message || 'Não foi possível carregar os dados financeiros.')
        setFinancialLoading(false)
        return
      }

      const paymentsByContract = new Map()
      const paymentsByService = new Map()
      for (const row of paymentsResult.data || []) {
        if (row.recurring_occurrence_id) continue
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
        else if (row.service_id) {
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
      setTransactions((transactionsResult.data || []).map((row) => ({
        id: row.id,
        date: row.date,
        amount: Number(row.amount || 0),
        createdAt: row.created_at,
      })))
      setFinancialError('')
      setFinancialLoading(false)
    }).catch((error) => {
      if (!active) return
      setFinancialError(error.message || 'Não foi possível carregar os dados financeiros.')
      setFinancialLoading(false)
    })

    return () => { active = false }
  }, [])

  const filteredTransactions = useMemo(() => transactions.filter((item) => item.date?.startsWith(periodValue)), [periodValue, transactions])
  // Calcula os indicadores financeiros a partir dos contratos e serviços persistidos.
  const summary = getFinancialPeriodSummary({ clientContracts, services, recurringContracts, view, periodValue })
  const spark = filteredTransactions.map((item) => Number(item.amount || 0))
  const metrics = [
    { label: 'Clientes ativos', value: clients.length, change: '', detail: 'cadastros no workspace', tone: 'violet', spark },
    { label: 'Valores pagos', value: `R$ ${summary.totals.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: '', detail: 'pagamentos recebidos no período', tone: 'violet', spark },
    { label: 'Valores a receber', value: `R$ ${summary.totals.receivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: '', detail: 'valores pendentes no período', tone: 'violet', spark },
  ]

  // Define o intervalo selecionado e reinicia a visualização quando o usuário escolhe todos os dados.
  function handlePeriodChange(event) {
    setPeriodValue(event.target.value)
  }

  // Mantém o mês selecionado ao alternar para mensal e usa o ano atual ao alternar para anual.
  function handleViewChange(nextView) {
    setView(nextView)
    setPeriodValue(nextView === 'annual' ? String(now.getFullYear()) : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  }

  return <div className="grid gap-5 animate-[fade-in_0.45s_ease-out]">
    {/* Apresenta o contexto da página e os filtros principais do período. */}
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-1 text-xs font-semibold text-[#7138ef]">Visão geral</p><h1 className="text-3xl font-bold tracking-tight text-[#171b32]">Dashboard</h1><p className="mt-1 text-sm text-[#737b91]">Acompanhe os principais indicadores e a performance da agência.</p></div><div className="flex flex-wrap gap-2">{view === 'monthly' ? <input type="month" value={periodValue} onChange={handlePeriodChange} className="rounded-lg border border-[#d9dce8] bg-white px-3 py-2 text-xs text-[#4d566f]" /> : <input type="number" value={periodValue} onChange={handlePeriodChange} className="w-24 rounded-lg border border-[#d9dce8] bg-white px-3 py-2 text-xs text-[#4d566f]" aria-label="Ano do período" />}<Button className="bg-[#7138ef] hover:bg-[#5f27d4]">⌕ Filtrar</Button></div></div>
    {financialLoading && <p role="status" className="text-xs text-[#737b91]">Carregando dados financeiros...</p>}
    {financialError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-[#b42345]">Não foi possível carregar os dados financeiros: {financialError}</p>}
    {operationalLoading && <p role="status" className="text-xs text-[#737b91]">Carregando demandas e eventos...</p>}
    {operationalError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-[#b42345]">{operationalError}</p>}
    {/* Exibe os indicadores-chave em uma grade que se adapta a telas menores. */}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div>
    {/* Divide a área analítica entre a evolução da receita e os alertas operacionais. */}
    <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]"><PerformanceChart clientContracts={clientContracts} services={services} recurringContracts={recurringContracts} view={view} periodValue={periodValue} onViewChange={handleViewChange} /><AttentionList demands={demands} recurringContracts={recurringContracts} clients={clients} /></div>
    {/* Mantém as demandas e a agenda visíveis na mesma área de trabalho. */}
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]"><ProjectTable demands={demands} clients={clients} /><UpcomingCommitments events={events} /></div>
    {/* Oferece o próximo passo quando o workspace ainda está vazio. */}
    {!clients.length && !demands.length && !transactions.length && !events.length && <div className="rounded-xl border border-dashed border-[#c9bafa] bg-[#faf8ff] p-6 text-center text-sm text-[#6d52c8]">Comece cadastrando clientes e lançamentos para preencher seu dashboard.</div>}
  </div>
}
