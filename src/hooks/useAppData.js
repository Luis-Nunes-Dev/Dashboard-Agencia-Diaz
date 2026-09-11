import { useContext } from 'react'
import { AppDataContext } from '../context/AppDataContext'

export function useAppData() {
  const context = useContext(AppDataContext)
  if (!context) throw new Error('useAppData deve ser usado dentro de AppDataProvider')
  return context
}
