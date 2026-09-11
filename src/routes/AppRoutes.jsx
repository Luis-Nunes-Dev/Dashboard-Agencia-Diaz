import { Routes, Route } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { Dashboard } from '../pages/Dashboard'
import { Clientes } from '../pages/Clientes'
import { Agenda } from '../pages/Agenda'
import { Demandas } from '../pages/Demandas'
import { Financeiro } from '../pages/Financeiro'
import { Configuracoes } from '../pages/Configuracoes'
import { Usuarios } from '../pages/Usuarios'
import { Login } from '../pages/Login'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRoutes() {
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="demandas" element={<Demandas />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="usuarios" element={<Usuarios />} />
      </Route>
    </Route>
  </Routes>
}
