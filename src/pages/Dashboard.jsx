import { useMemo, useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { getFinancialPeriodSummary } from '../services/financeUtils'
import { MetricCard } from '../components/dashboard/MetricCard'
import { ProjectTable } from '../components/dashboard/ProjectTable'
import { PerformanceChart } from '../components/dashboard/PerformanceChart'
import { AttentionList } from '../components/dashboard/AttentionList'
import { UpcomingCommitments } from '../components/dashboard/UpcomingCommitments'
import { Button } from '../components/ui/Button'

export function Dashboard() {
  const { clients, projects, demands, transactions, events, clientContracts, recurringContracts, services } = useAppData()
  const now = new Date()
  const [view, setView] = useState('monthly')
  const [periodValue, setPeriodValue] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  const filteredTransactions = useMemo(() => transactions.filter((item) => item.date?.startsWith(periodValue)), [periodValue, transactions])
  // Calcula os indicadores financeiros a partir dos contratos e serviços persistidos.
  const summary = getFinancialPeriodSummary({ clientContracts, services, recurringContracts, view, periodValue })
  const spark = filteredTransactions.map((item) => Number(item.amount || 0))
  const metrics = [
    { label: 'Clientes ativos', value: clients.length, change: '', detail: 'cadastros no workspace', tone: 'violet', spark },
    { label: 'Projetos em andamento', value: projects.length, change: '', detail: 'projetos cadastrados', tone: 'violet', spark },
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
    {/* Exibe os indicadores-chave em uma grade que se adapta a telas menores. */}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div>
    {/* Divide a área analítica entre a evolução da receita e os alertas operacionais. */}
    <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]"><PerformanceChart clientContracts={clientContracts} services={services} recurringContracts={recurringContracts} view={view} periodValue={periodValue} onViewChange={handleViewChange} /><AttentionList demands={demands} projects={projects} recurringContracts={recurringContracts} clients={clients} /></div>
    {/* Mantém as demandas e a agenda visíveis na mesma área de trabalho. */}
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]"><ProjectTable demands={demands} clients={clients} /><UpcomingCommitments events={events} /></div>
    {/* Oferece o próximo passo quando o workspace ainda está vazio. */}
    {!clients.length && !projects.length && !demands.length && !transactions.length && !events.length && <div className="rounded-xl border border-dashed border-[#c9bafa] bg-[#faf8ff] p-6 text-center text-sm text-[#6d52c8]">Comece cadastrando clientes, projetos e lançamentos para preencher seu dashboard.</div>}
  </div>
}
