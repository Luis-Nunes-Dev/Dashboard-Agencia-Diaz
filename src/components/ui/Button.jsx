export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-(--color-primary) text-white hover:bg-(--color-primary-hover) shadow-sm',
    secondary: 'border border-(--color-border) bg-white text-(--color-text) hover:bg-(--color-primary-light)',
    ghost: 'text-(--color-text-muted) hover:bg-(--color-primary-light) hover:text-(--color-primary)',
  }

  return <button className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${variants[variant]} ${className}`} {...props}>{children}</button>
}

