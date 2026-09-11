import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { Link } from 'react-router-dom'
import { EmptyState } from '../ui/EmptyState'

// Mapeia o status da demanda para a cor sem espalhar regras pela tabela.
const statusTone = { 'Em andamento': 'info', 'Em revisão': 'success', 'Aguardando info': 'info', Pendente: 'default' }

export function ProjectTable({ demands, clients }) {
  // Renderiza o quadro principal de demandas com progresso e prazo.
  return <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-[#edf1ee] px-5 py-4"><div><h2 className="font-bold text-[#17213d]">Demandas</h2><p className="mt-1 text-xs text-[#9299ad]">Acompanhe as entregas mais recentes</p></div><Link to="/demandas" className="text-xs font-semibold text-[#7138ef]">Ver todas</Link></div>{demands.length ? <div className="overflow-x-auto"><table className="w-full min-w-150 text-left text-sm"><thead><tr className="border-b border-[#edf1ee] text-[10px] uppercase tracking-[0.08em] text-[#9299ad]"><th className="px-5 py-3 font-semibold">Demanda</th><th className="px-5 py-3 font-semibold">Cliente</th><th className="px-5 py-3 font-semibold">Prazo</th><th className="px-5 py-3 font-semibold">Status</th></tr></thead><tbody>{demands.slice(0, 5).map((demand) => { const client = clients.find((item) => item.id === demand.clientId); return <tr key={demand.id} className="border-b border-[#f0f1f6] last:border-0"><td className="px-5 py-3"><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-md bg-[#f0eaff] text-xs text-[#7138ef]">▧</span><span className="whitespace-nowrap text-xs font-semibold text-[#30374e]">{demand.title}</span></div></td><td className="px-5 py-3 text-xs text-[#606981]">{client?.name || 'Sem cliente'}</td><td className="px-5 py-3 text-xs text-[#606981]">{demand.dueDate || 'Sem prazo'}</td><td className="px-5 py-3"><Badge tone={statusTone[demand.status]}>{demand.status}</Badge></td></tr> })}</tbody></table></div> : <EmptyState title="Nenhuma demanda cadastrada" description="Crie uma demanda para acompanhar as entregas da agência." actionLabel="Criar demanda" onAction={() => window.location.assign('/demandas')} />}</Card>
}
