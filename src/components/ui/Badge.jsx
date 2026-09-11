export function Badge({ children, tone = 'default' }) {
  const tones = { default: 'bg-(--color-surface) text-(--color-text-muted)', success: 'bg-(--color-primary-light) text-(--color-primary)', warning: 'bg-(--color-primary-light) text-(--color-primary)', info: 'bg-(--color-primary-light) text-(--color-primary)' }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.default}`}>{children}</span>
}

