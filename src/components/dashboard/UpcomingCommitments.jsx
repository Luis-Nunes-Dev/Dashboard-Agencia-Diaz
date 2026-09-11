import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'

// Renderiza os próximos eventos persistidos, sem criar compromissos automaticamente.
export function UpcomingCommitments({ events }) {
  return <Card className="p-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-bold text-[#17213d]">Próximos compromissos</h2><Link to="/agenda" className="text-xs font-semibold text-[#7138ef]">Ver agenda</Link></div>{events.length ? <div>{events.slice(0, 4).map((item) => <div key={item.id} className="flex gap-3 border-b border-[#f0f1f6] py-3 last:border-0"><div className="w-20 shrink-0 border-r border-[#e6e8f0] text-[10px] text-[#7138ef]"><strong className="block">{item.date}</strong><span className="text-[#30374e]">{item.time}</span></div><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#30374e]">{item.title}</p><p className="mt-1 truncate text-[10px] text-[#9299ad]">{item.description || 'Sem descrição'}</p></div></div>)}</div> : <EmptyState title="Nenhum compromisso" description="Sua agenda aparecerá aqui quando você cadastrar eventos." />}</Card>
}
