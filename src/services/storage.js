const STORAGE_KEY = 'agencia-diaz-data'

const emptyData = { clients: [], projects: [], demands: [], transactions: [], events: [], users: [], clientContracts: [], recurringContracts: [], services: [], currentUserId: null }

function normalizeArray(value) {
  return Array.isArray(value) ? value : []
}

// Lê os dados persistidos sem quebrar a aplicação se o conteúdo estiver inválido.
export function loadData() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return emptyData
    const data = { ...emptyData, ...JSON.parse(saved) }
    data.clients = normalizeArray(data.clients)
    data.projects = normalizeArray(data.projects)
    data.demands = normalizeArray(data.demands)
    data.transactions = normalizeArray(data.transactions)
    data.events = normalizeArray(data.events)
    data.users = normalizeArray(data.users).map((user) => { const cleanUser = { ...user }; delete cleanUser.password; return cleanUser })
    data.clientContracts = normalizeArray(data.clientContracts)
    data.recurringContracts = normalizeArray(data.recurringContracts)
    data.services = normalizeArray(data.services)
    data.currentUserId = data.users.some((user) => user.id === data.currentUserId) ? data.currentUserId : (data.users[0]?.id || null)
    return data
  } catch {
    return emptyData
  }
}

// Persiste o estado atual do workspace no navegador.
export function saveData(data) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
