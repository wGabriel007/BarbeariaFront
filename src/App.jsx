import { Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom'
import { FnLayout } from './componentes/Layout'
import { FnRotaProtegida } from './componentes/RotaProtegida'
import { FnRotaProtegidaAdmin } from './componentes/RotaProtegidaAdmin'
import { FnPortaDaBarbearia } from './componentes/PortaDaBarbearia'
import { useAuth } from './contexto/AuthContext'
import { FnLanding } from './paginas/Landing'
import { FnPoliticaPrivacidade } from './paginas/PoliticaPrivacidade'
import { FnAdminLogin } from './paginas/AdminLogin'
import { FnAdminDashboard } from './paginas/AdminDashboard'
import { FnNaoEncontrada } from './paginas/NaoEncontrada'
import { FnLogin } from './paginas/Login'
import { FnCadastro } from './paginas/Cadastro'
import { FnAgenda } from './paginas/Agenda'
import { FnMeusAgendamentos } from './paginas/MeusAgendamentos'
import { FnFilaDeEspera } from './paginas/FilaDeEspera'
import { FnSolicitacoes } from './paginas/Solicitacoes'
import { FnClientes } from './paginas/Clientes'
import { FnServicos } from './paginas/Servicos'
import { FnBarbeiros } from './paginas/Barbeiros'
import { FnPlanos } from './paginas/Planos'
import { FnMeuPlano } from './paginas/MeuPlano'
import { FnUsuarios } from './paginas/Usuarios'
import { FnPagamentos } from './paginas/Pagamentos'
import { FnPerfil } from './paginas/Perfil'
import { FnConfiguracaoAparencia } from './paginas/ConfiguracaoAparencia'
import { FnSobreABarbearia } from './paginas/SobreABarbearia'
import { FnRanking } from './paginas/Ranking'

// O "início" de uma barbearia (índice de "/:slug") também não é uma
// página própria — cada tipo de usuário tem um diferente (staff cai na
// FnAgenda do dia; Comum cai em "meus agendamentos", já que ele não vê a
// FnAgenda — ver Layout.jsx/ITENS_MENU).
function FnInicio() {
  const { ehStaff } = useAuth()
  const { slug } = useParams()
  return <Navigate to={`/${slug}/${ehStaff ? 'agenda' : 'meus-agendamentos'}`} replace />
}

// Mapa de URL -> página.
//
// Multi-barbearia: cada barbearia vive sob seu próprio "/:slug" — é o
// que separa uma barbearia da outra no FRONT (o back já separa os dados
// por trás, ver EmpresaResolverMiddleware/HasQueryFilter na Api). Só
// "/:slug/login" e "/:slug/cadastro" são públicas dentro dessa área;
// tudo dentro de <FnLayout/> passa primeiro por <FnRotaProtegida/>, que
// manda pra lá quem não estiver autenticado NAQUELA barbearia (ver
// componentes/RotaProtegida.jsx). A área "/admin" é a da plataforma em
// si (o SuperAdmin, dono do sistema — ver componentes/RotaProtegidaAdmin.jsx)
// e não tem slug nenhum. A raiz "/" é só uma landing (ver
// paginas/Landing.jsx) — não pertence a nenhuma barbearia.
export default function FnApp() {
  return (
    <Routes>
      <Route path="/" element={<FnLanding />} />
      <Route path="/politica-de-privacidade" element={<FnPoliticaPrivacidade />} />

      <Route path="/admin/login" element={<FnAdminLogin />} />
      <Route
        path="/admin"
        element={
          <FnRotaProtegidaAdmin>
            <FnAdminDashboard />
          </FnRotaProtegidaAdmin>
        }
      />

      <Route path="/:slug" element={<FnPortaDaBarbearia><Outlet /></FnPortaDaBarbearia>}>
        <Route path="login" element={<FnLogin />} />
        <Route path="cadastro" element={<FnCadastro />} />

        <Route
          element={
            <FnRotaProtegida>
              <FnLayout />
            </FnRotaProtegida>
          }
        >
          <Route index element={<FnInicio />} />
          <Route
            path="agenda"
            element={
              <FnRotaProtegida somenteStaff>
                <FnAgenda />
              </FnRotaProtegida>
            }
          />
          <Route path="meus-agendamentos" element={<FnMeusAgendamentos />} />
          <Route path="fila-de-espera" element={<FnFilaDeEspera />} />
          <Route
            path="solicitacoes"
            element={
              <FnRotaProtegida somenteStaff>
                <FnSolicitacoes />
              </FnRotaProtegida>
            }
          />
          <Route
            path="clientes"
            element={
              <FnRotaProtegida somenteStaff>
                <FnClientes />
              </FnRotaProtegida>
            }
          />
          <Route path="servicos" element={<FnServicos />} />
          <Route path="barbeiros" element={<FnBarbeiros />} />
          <Route path="ranking" element={<FnRanking />} />
          <Route path="planos" element={<FnPlanos />} />
          <Route
            path="meu-plano"
            element={
              <FnRotaProtegida somenteComum>
                <FnMeuPlano />
              </FnRotaProtegida>
            }
          />
          <Route
            path="pagamentos"
            element={
              <FnRotaProtegida somenteStaff>
                <FnPagamentos />
              </FnRotaProtegida>
            }
          />
          <Route
            path="usuarios"
            element={
              <FnRotaProtegida somenteStaff>
                <FnUsuarios />
              </FnRotaProtegida>
            }
          />
          <Route path="perfil" element={<FnPerfil />} />
          <Route
            path="aparencia"
            element={
              <FnRotaProtegida somenteAdmin>
                <FnConfiguracaoAparencia />
              </FnRotaProtegida>
            }
          />
          {/* Sem somenteStaff/somenteComum: aberta pra todo mundo — só a
              EDIÇÃO (formulários dentro da página) é staff-only, decidida
              na própria FnSobreABarbearia via useAuth().ehStaff (a Api já
              recusa a alteração pra um Comum, isso aqui é só não mostrar
              formulário nenhum pra quem não pode usar). */}
          <Route path="sobre-barbearia" element={<FnSobreABarbearia />} />
        </Route>
      </Route>

      <Route path="*" element={<FnNaoEncontrada />} />
    </Routes>
  )
}
