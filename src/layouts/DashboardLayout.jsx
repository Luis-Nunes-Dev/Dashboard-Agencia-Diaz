import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { UserMenu } from '../components/UserMenu'

const navigation = [
  { label: 'Visão geral', path: '/', icon: '▦' },
  { label: 'Clientes', path: '/clientes', icon: '♙' },
  { label: 'Agenda', path: '/agenda', icon: '◫' },
  { label: 'Demandas', path: '/demandas', icon: '☷' },
  { label: 'Financeiro', path: '/financeiro', icon: '◒' },
  { label: 'Usuários', path: '/usuarios', icon: '♙' },
]

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return <div className="min-h-screen bg-(--color-background) text-(--color-text)">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-(--color-border) bg-(--color-surface) px-4 py-5 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center gap-3 px-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-(--color-primary) text-lg font-bold text-white">d.</div><span className="text-lg font-bold tracking-tight text-(--color-text)">Agência Diaz<span className="text-(--color-primary)">.</span></span></div>
      <p className="mb-3 mt-10 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-(--color-text-muted)">Workspace</p>
      <nav className="grid gap-1">{navigation.map((item) => <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-(--color-primary-light) text-(--color-primary)' : 'text-(--color-text-muted) hover:bg-(--color-primary-light) hover:text-(--color-primary)'}`}><span className="grid w-5 place-items-center text-base">{item.icon}</span>{item.label}</NavLink>)}</nav>
      <NavLink to="/configuracoes" onClick={() => setSidebarOpen(false)} className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#70837d] hover:bg-[#f3efff]"><span className="w-5 text-center">⚙</span>Configurações</NavLink>
    </aside>
    {sidebarOpen && <button className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu" />}
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-18 items-center justify-between border-b border-(--color-border) bg-white/95 px-5 backdrop-blur lg:px-8"><button className="rounded-lg p-2 text-xl text-(--color-text-muted) lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu">☰</button><div className="hidden lg:block"><p className="text-xs text-(--color-text-muted)">Workspace da agência</p><p className="text-sm font-semibold text-(--color-text)">Visão operacional <span className="ml-1 text-(--color-primary)">✦</span></p></div><div className="ml-auto flex items-center gap-4"><button className="relative grid h-9 w-9 place-items-center rounded-lg text-lg text-(--color-text-muted) hover:bg-(--color-primary-light)" aria-label="Notificações">♧<span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-(--color-primary)" /></button><div className="h-7 w-px bg-(--color-border)" /><UserMenu /></div></header><main className="mx-auto max-w-360 p-5 lg:p-8"><Outlet /></main></div>
  </div>
}

