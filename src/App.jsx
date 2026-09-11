import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes/AppRoutes'
import { AppDataProvider } from './context/AppDataContext.jsx'
import { AuthProvider } from './context/AuthContext'

function App() {
  // Mantém o estado do workspace disponível e autenticado para todas as rotas.
  return <AppDataProvider><AuthProvider><BrowserRouter><AppRoutes /></BrowserRouter></AuthProvider></AppDataProvider>
}

export default App
