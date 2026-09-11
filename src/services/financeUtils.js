// Retorna a data atual no formato ISO sem deslocamento de fuso horário.
export function todayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// Soma pagamentos realizados até hoje, ignorando agendamentos futuros.
export function paidAmount(payments = []) {
  const today = todayIso()
  return payments.reduce((sum, payment) => payment.date <= today ? sum + Number(payment.value || 0) : sum, 0)
}

// Calcula saldo financeiro sem permitir que pagamentos futuros sejam tratados como recebidos.
export function getFinancialTotals(record) {
  const paid = paidAmount(record.payments)
  return { paid, due: Math.max(0, Number(record.totalValue || 0) - paid) }
}

// Cria uma data mensal preservando o dia configurado quando o mês possui menos dias.
export function addMonth(dateValue, day) {
  const date = new Date(`${dateValue}T00:00:00`)
  const nextMonth = date.getMonth() + 1
  const lastDay = new Date(date.getFullYear(), nextMonth + 1, 0).getDate()
  return `${date.getFullYear() + Math.floor(nextMonth / 12)}-${String((nextMonth % 12) + 1).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`
}

// Informa se a competência já venceu e ainda não foi paga.
export function isOverdue(occurrence) {
  return occurrence.status !== 'Pago' && occurrence.dueDate < todayIso()
}

// Retorna o intervalo e os rótulos completos do mês ou ano selecionado.
export function getPeriod(view, periodValue) {
  const now = new Date()
  const value = periodValue || (view === 'annual' ? String(now.getFullYear()) : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  if (view === 'annual') return { value, start: `${value}-01-01`, end: `${value}-12-31`, labels: Array.from({ length: 12 }, (_, index) => new Date(Number(value), index, 1).toLocaleDateString('pt-BR', { month: 'short' })) }
  const [year, month] = value.split('-').map(Number)
  const days = new Date(year, month, 0).getDate()
  return { value, start: `${value}-01`, end: `${value}-${String(days).padStart(2, '0')}`, labels: Array.from({ length: days }, (_, index) => String(index + 1)) }
}

function inPeriod(date, period) {
  return Boolean(date && date >= period.start && date <= period.end)
}

// Converte contratos, serviços e recorrências em movimentos financeiros comparáveis.
function getMovements(clientContracts, services, recurringContracts) {
  const movements = []
  const today = todayIso()
  clientContracts.forEach((record) => {
    const payments = record.payments || []
    payments.forEach((payment) => movements.push({ date: payment.date, amount: Number(payment.value || 0), type: payment.date <= today ? 'paid' : 'receivable' }))
    const unpaid = Math.max(0, Number(record.totalValue || 0) - payments.reduce((sum, payment) => sum + Number(payment.value || 0), 0))
    if (unpaid) movements.push({ date: record.dueDate || today, amount: unpaid, type: 'receivable' })
  })
  services.forEach((record) => {
    const payments = record.payments || []
    payments.forEach((payment) => movements.push({ date: payment.date, amount: Number(payment.value || 0), type: payment.date <= today ? 'paid' : 'receivable' }))
    // Serviços finalizados mantêm os pagamentos no histórico, mas não geram saldo ativo.
    if (record.status !== 'Finalizado') {
      const unpaid = Math.max(0, Number(record.totalValue || 0) - payments.reduce((sum, payment) => sum + Number(payment.value || 0), 0))
      if (unpaid) movements.push({ date: record.dueDate || today, amount: unpaid, type: 'receivable' })
    }
  })
  recurringContracts.forEach((contract) => {
    const advancePayments = clientContracts.find((record) => record.clientId === contract.clientId)?.payments?.filter((payment) => payment.isRecurringAdvance && payment.date <= today) || []
    let availableAdvance = advancePayments.reduce((sum, payment) => sum + Number(payment.value || 0), 0)
    contract.occurrences.forEach((occurrence) => {
      if (occurrence.status === 'Pago' && occurrence.paymentDate) {
        movements.push({ date: occurrence.paymentDate, amount: Number(occurrence.amount || 0), type: occurrence.paymentDate <= today ? 'paid' : 'receivable' })
        return
      }
      const amount = Number(occurrence.amount || 0)
      const coveredByAdvance = Math.min(amount, availableAdvance)
      availableAdvance -= coveredByAdvance
      const pending = amount - coveredByAdvance
      if (pending) movements.push({ date: occurrence.dueDate, amount: pending, type: 'receivable' })
    })
  })
  return movements
}

// Gera a mesma série usada pelo gráfico e pelos cards do Dashboard.
export function getFinancialPeriodSummary({ clientContracts = [], services = [], recurringContracts = [], view = 'monthly', periodValue }) {
  const period = getPeriod(view, periodValue)
  const data = period.labels.map((label) => ({ label, paid: 0, receivable: 0 }))
  getMovements(clientContracts, services, recurringContracts).forEach((movement) => {
    if (!inPeriod(movement.date, period)) return
    const index = view === 'annual' ? Number(movement.date.slice(5, 7)) - 1 : Number(movement.date.slice(8, 10)) - 1
    if (data[index]) data[index][movement.type] += movement.amount
  })
  return { period, data, totals: data.reduce((result, item) => ({ paid: result.paid + item.paid, receivable: result.receivable + item.receivable }), { paid: 0, receivable: 0 }) }
}
