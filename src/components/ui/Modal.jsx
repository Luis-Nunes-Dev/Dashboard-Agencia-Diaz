import { Button } from './Button'

export function Modal({ open, title, children, onClose, onConfirm, confirmLabel = 'Salvar' }) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#102d2a]/35 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold text-[#173c38]">{title}</h2><button onClick={onClose} className="text-2xl leading-none text-[#8ba09a] hover:text-[#173c38]" aria-label="Fechar">×</button></div>
      {children}
      <div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={onConfirm || onClose}>{confirmLabel}</Button></div>
    </div>
  </div>
}
