export function Avatar({ initials, className = '' }) {
  return <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-primary-light) text-xs font-bold text-(--color-primary) ${className}`}>{initials}</span>
}

