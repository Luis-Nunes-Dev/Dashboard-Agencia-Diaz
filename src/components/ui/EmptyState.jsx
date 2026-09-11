import { Button } from './Button'

// Exibe uma ação clara quando uma coleção ainda não possui registros.
export function EmptyState({ title, description, actionLabel, onAction }) {
  return <div className="grid place-items-center gap-2 px-6 py-12 text-center"><div className="grid h-12 w-12 place-items-center rounded-full bg-[#f0eaff] text-xl text-[#7138ef]">＋</div><h2 className="mt-2 text-base font-bold text-[#17213d]">{title}</h2><p className="max-w-sm text-sm text-[#9299ad]">{description}</p>{onAction && <Button className="mt-3 bg-[#7138ef] hover:bg-[#5f27d4]" onClick={onAction}>{actionLabel}</Button>}</div>
}
