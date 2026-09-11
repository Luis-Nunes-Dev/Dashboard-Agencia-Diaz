import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from './ui/Avatar'
import { useAppData } from '../hooks/useAppData'
import { useAuth } from '../context/AuthContext'

export function UserMenu() {
  const { currentUser, users, setCurrentUser } = useAppData()
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const user = currentUser
  const displayName = user?.name || 'Nenhum usuário'
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : '--'

  // Fecha o menu ao clicar fora ou pressionar Escape.
  useEffect(() => {
    function closeMenu(event) {
      if (event.type === 'keydown' && event.key === 'Escape') setOpen(false)
      if (event.type === 'mousedown' && !menuRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', closeMenu)
    document.addEventListener('keydown', closeMenu)
    return () => { document.removeEventListener('mousedown', closeMenu); document.removeEventListener('keydown', closeMenu) }
  }, [])

  // Executa uma ação do menu e fecha o popover imediatamente.
  function goTo(path) { setOpen(false); navigate(path) }
  function handleLogout() { logout(); setOpen(false); navigate('/login', { replace: true }) }

  return <div ref={menuRef} className="relative"><button onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded-lg p-1.5 text-left hover:bg-(--color-primary-light)" aria-expanded={open} aria-haspopup="menu"><Avatar initials={initials} /><span className="hidden sm:block"><strong className="block text-sm text-(--color-text)">{displayName}</strong><small className="block text-[11px] text-(--color-text-muted)">{user?.papel || 'Sem sessão'}</small></span><span className="text-xs text-(--color-text-muted)">⌄</span></button>{open && <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-(--color-border) bg-white p-1.5 shadow-xl" role="menu"><p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-(--color-text-muted)">Trocar usuário</p>{users.length ? users.map((option) => <button key={option.id} onClick={() => { setCurrentUser(option.id); setOpen(false) }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-(--color-primary-light) ${option.id === user?.id ? 'font-semibold text-(--color-primary)' : 'text-(--color-text)'}`}><Avatar initials={option.name.slice(0, 2).toUpperCase()} className="h-7 w-7 text-[10px]" /><span>{option.name}</span></button>) : <p className="px-3 py-2 text-xs text-(--color-text-muted)">Nenhum usuário cadastrado</p>}<button onClick={() => goTo('/configuracoes')} className="mt-1 block w-full border-t border-(--color-border) px-3 py-2.5 text-left text-sm text-(--color-text) hover:bg-(--color-primary-light)">Meu perfil</button><button onClick={() => goTo('/usuarios')} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-(--color-text) hover:bg-(--color-primary-light)">Usuários da agência</button><button onClick={handleLogout} className="mt-1 block w-full border-t border-(--color-border) px-3 py-2.5 text-left text-sm text-[#b42345]">Sair</button></div>}</div>
}

