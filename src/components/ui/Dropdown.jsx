import { useState } from 'react'

export function Dropdown({ label = 'Este mês', options = ['Este mês', 'Último mês', 'Este trimestre'] }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(label)
  return <div className="relative"><button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg border border-(--color-border) bg-white px-3 py-2 text-sm font-medium text-(--color-text-muted)">{selected}<span className="text-xs">⌄</span></button>{open && <div className="absolute right-0 top-11 z-20 w-40 rounded-lg border border-(--color-border) bg-white p-1 shadow-lg">{options.map((option) => <button key={option} onClick={() => { setSelected(option); setOpen(false) }} className="block w-full rounded-md px-3 py-2 text-left text-sm text-(--color-text-muted) hover:bg-(--color-primary-light)">{option}</button>)}</div>}</div>
}

