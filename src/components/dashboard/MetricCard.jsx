import { Card } from '../ui/Card'
import { Line, LineChart, ResponsiveContainer } from 'recharts'

export function MetricCard({ label, value, change, detail, spark }) {
  // Define o tratamento visual único dos indicadores da página inicial.
  const accent = 'bg-(--color-primary-light) text-(--color-primary)'
  const sparkData = spark?.map((point) => ({ value: Number(point) }))
  return <Card className="overflow-hidden p-4"><div className="mb-4 flex items-center justify-between"><span className="text-xs font-medium text-[#737b91]">{label}</span><span className={`grid h-9 w-9 place-items-center rounded-full text-lg ${accent}`}>♧</span></div><div className="flex items-end gap-2"><strong className="text-2xl font-bold tracking-tight text-[#171b32]">{value}</strong>{change && <span className={`mb-0.5 text-xs font-bold ${accent.split(' ')[1]}`}>↑ {change}</span>}</div><p className="mt-1.5 text-[10px] text-[#9299ad]">{detail}</p>{sparkData?.length ? <div className="mt-3 h-8 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={sparkData}><Line type="monotone" dataKey="value" stroke="#7138ef" strokeWidth={1.5} dot={false} /></LineChart></ResponsiveContainer></div> : <p className="mt-3 text-[10px] text-[#b0b5c5]">Sem dados para tendência</p>}</Card>
}

