import { useState } from 'react'

// Formata valores numéricos no padrão monetário brasileiro.
function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Converte o texto digitado em número sem armazenar máscara no estado financeiro.
function parseCurrency(value) {
  const normalized = value.replace(/[^0-9,]/g, '').replace(',', '.')
  return Number(normalized) || 0
}

export function CurrencyInput({ label, value, onChange }) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')
  const displayValue = focused ? draft : formatCurrency(value)

  // Mantém a edição simples enquanto aplica a formatação ao sair do campo.
  function handleChange(event) {
    const nextValue = event.target.value.replace(/[^0-9,]/g, '')
    setDraft(nextValue)
    onChange(parseCurrency(nextValue))
  }

  function handleFocus() {
    setFocused(true)
    setDraft(value ? String(value).replace('.', ',') : '')
  }

  function handleBlur() {
    setFocused(false)
    setDraft('')
  }

  return <label className="grid gap-1.5 text-xs font-medium text-(--color-text-muted)">{label}<input type="text" inputMode="decimal" value={displayValue} onFocus={handleFocus} onBlur={handleBlur} onChange={handleChange} className="w-32 rounded border border-(--color-border) px-2 py-1.5 text-right text-sm text-(--color-text) outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary-light)" placeholder="R$ 0,00" /></label>
}

