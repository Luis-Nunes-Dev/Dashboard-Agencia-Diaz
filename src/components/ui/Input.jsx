export function Input({ label, className = '', ...props }) {
  return <label className="grid gap-1.5 text-sm font-medium text-(--color-text-muted)">{label}<input className={`rounded-lg border border-(--color-border) bg-white px-3 py-2.5 text-sm text-(--color-text) outline-none transition placeholder:text-[#9a9ca3] focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary-light) ${className}`} {...props} /></label>
}

