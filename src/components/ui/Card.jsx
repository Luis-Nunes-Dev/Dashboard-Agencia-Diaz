export function Card({ children, className = '', ...props }) {
  // Repassa eventos e atributos para permitir interações como drag-and-drop.
  return <section className={`rounded-xl border border-[#e2e9e4] bg-white shadow-[0_2px_10px_rgba(34,61,51,0.035)] ${className}`} {...props}>{children}</section>
}
