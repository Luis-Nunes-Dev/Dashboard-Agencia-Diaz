export function Table({ columns, rows, renderRow }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-160 text-left text-sm"><thead><tr className="border-b border-(--color-border) text-xs uppercase tracking-[0.08em] text-(--color-text-muted)">{columns.map((column) => <th key={column} className="px-5 py-3 font-semibold">{column}</th>)}</tr></thead><tbody>{rows.map(renderRow)}</tbody></table></div>
}

