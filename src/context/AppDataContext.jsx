import { useEffect, useState } from 'react'
import { loadData, saveData } from '../services/storage'
import { AppDataContext } from './AppDataContext'

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function AppDataProvider({ children }) {
  const [data, setData] = useState(() => {
    const loaded = loadData()
    return loaded.currentUserId || !loaded.users.length ? loaded : { ...loaded, currentUserId: loaded.users[0].id }
  })

  // Persiste qualquer alteração feita por um formulário ou ação de CRUD.
  useEffect(() => saveData(data), [data])

  // Cria uma entidade e retorna o registro criado para uso imediato na interface.
  function addEntity(entity, values) {
    const item = { ...values, id: createId(), createdAt: new Date().toISOString() }
    setData((current) => ({ ...current, [entity]: [...current[entity], item], currentUserId: entity === 'users' && !current.currentUserId ? item.id : current.currentUserId }))
    return item
  }

  // Atualiza somente os campos enviados, mantendo o restante do registro.
  function updateEntity(entity, id, values) {
    setData((current) => ({ ...current, [entity]: current[entity].map((item) => item.id === id ? { ...item, ...values } : item) }))
  }

  // Remove a entidade selecionada do estado persistido.
  function deleteEntity(entity, id) {
    setData((current) => ({ ...current, [entity]: current[entity].filter((item) => item.id !== id) }))
  }

  // Permite trocar ou encerrar a sessão atual até a autenticação real existir.
  function setCurrentUser(userId) {
    setData((current) => ({ ...current, currentUserId: userId }))
  }

  const currentUser = data.users.find((user) => user.id === data.currentUserId) || null
  return <AppDataContext.Provider value={{ ...data, currentUser, addEntity, updateEntity, deleteEntity, setCurrentUser }}>{children}</AppDataContext.Provider>
}

