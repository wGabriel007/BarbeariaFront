import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexto/AuthContext'

// Equivalente a RotaProtegida.jsx, mas pra área do SuperAdmin (dono da
// plataforma, "/admin/..." — ver App.jsx). Separado do outro de
// propósito: os conceitos de "somenteStaff/somenteComum/somenteAdmin"
// (que são sobre papéis DENTRO de uma barbearia) não existem aqui — só
// importa ser SuperAdmin ou não.
export function FnRotaProtegidaAdmin({ children }) {
  const { autenticado, ehSuperAdmin } = useAuth()
  const location = useLocation()

  if (!autenticado || !ehSuperAdmin) {
    return <Navigate to="/admin/login" replace state={{ de: location }} />
  }

  return children
}
