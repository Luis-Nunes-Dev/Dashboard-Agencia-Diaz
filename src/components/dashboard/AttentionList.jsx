import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'

// Deriva alertas simples das entidades cadastradas no workspace.
export function AttentionList({ demands, projects, recurringContracts, clients }) {
  const delayed = demands.filter((item) => item.status !== 'Concluída' && item.dueDate && item.dueDate < new Date().toISOString().slice(0, 10)).length
  const overdueRecurring = (recurringContracts || []).flatMap((contract) => contract.occurrences.filter((occurrence) => occurrence.status !== 'Pago' && occurrence.dueDate < new Date().toISOString().slice(0, 10)).map((occurrence) => ({ ...occurrence, client: clients.find((item) => item.id === contract.clientId) })))
  const items = [...overdueRecurring.map((item) => ({ label: `${item.client?.name || 'Cliente'} · pagamento mensal atrasado`, detail: `${item.amount} · vencimento ${item.dueDate}`, color: 'bg-[#ef4444]' })), ...(delayed ? [{ label: `${delayed} demanda(s) atrasada(s)`, detail: 'Confira o fluxo de trabalho', color: 'bg-[#ef4444]' }] : []), ...(projects.length ? [{ label: `${projects.length} projeto(s) cadastrado(s)`, detail: 'Projetos ativos na agência', color: 'bg-[#7138ef]' }] : [])]
  return <Card className="p-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-bold text-[#17213d]">Pontos de atenção</h2><Link to="/financeiro" className="text-xs font-semibold text-[#7138ef]">Ver todas</Link></div>{items.length ? <div>{items.map((item) => <div key={`${item.label}-${item.detail}`} className="flex items-center gap-3 border-b border-[#f0f1f6] py-3 last:border-0"><span className={`h-2 w-2 shrink-0 rounded-full ${item.color}`} /><div><p className="text-xs font-medium text-[#30374e]">{item.label}</p><p className="mt-1 text-[10px] text-[#9299ad]">{item.detail}</p></div><span className="ml-auto text-lg text-[#7d8499]">›</span></div>)}</div> : <EmptyState title="Tudo em dia" description="Alertas da operação aparecerão aqui." />}</Card>
}
