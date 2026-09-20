import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexto/AuthContext'
import { useCaminhoBarbearia } from '../ganchos/useCaminhoBarbearia'

// Embrulha as rotas que exigem Fnlogin (tudo dentro do <FnLayout/> — ver
// App.jsx). Sem sessão válida, manda pra /login e guarda de onde a
// pessoa veio em "state.de", pra dar pra voltar exatamente pra lá
// depois de logar (ver Login.jsx).
//
// "somenteStaff" é usado nas rotas que só Admin/Barbeiro acessam
// (Usuários, FnPagamentos) — a Api já recusa essas chamadas pra um Comum
// (ver os Controllers com [Authorize(Roles = "Admin,Barbeiro")]), isso
// aqui só evita a pessoa cair numa tela cheia de erro 403 se digitar a
// URL direto (o item já nem aparece na barra lateral — ver Layout.jsx).
//
// "somenteComum" é o inverso: usado em rotas que só fazem sentido pra
// quem NÃO é staff (ex.: "Meu plano" — um Admin/Barbeiro não tem
// assinatura própria pra gerenciar ali).
//
// "somenteAdmin" é mais restrito ainda que "somenteStaff": nem todo
// staff entra, só quem é Admin de verdade — usado em "Aparência" (logo
// e cor do site são decisão de dono do negócio, não do dia a dia que um
// Barbeiro cuida).
export function FnRotaProtegida({ children, somenteStaff = false, somenteComum = false, somenteAdmin = false }) {
  const { autenticado, ehStaff, usuario } = useAuth()
  const location = useLocation()
  const Fncaminho = useCaminhoBarbearia()

  if (!autenticado) {
    return <Navigate to={Fncaminho('/login')} replace state={{ de: location }} />
  }

  if (somenteStaff && !ehStaff) {
    return <Navigate to={Fncaminho()} replace />
  }

  if (somenteComum && ehStaff) {
    return <Navigate to={Fncaminho()} replace />
  }

  if (somenteAdmin && usuario?.tipo !== 'Admin') {
    return <Navigate to={Fncaminho()} replace />
  }

  return children
}
