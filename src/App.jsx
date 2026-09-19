import { Navigate, Route, Routes } from 'react-router-dom'
import { FnLayout } from './componentes/Layout'
import { FnRotaProtegida } from './componentes/RotaProtegida'
import { useAuth } from './contexto/AuthContext'
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

// A raiz "/" não é mais uma página própria — cada tipo de usuário tem um
// "início" diferente (staff cai na FnAgenda do dia; Comum cai em "meus
// agendamentos", já que ele não vê a FnAgenda — ver Layout.jsx/ITENS_MENU).
function FnInicio() {
  const { ehStaff } = useAuth()
  return <Navigate to={ehStaff ? '/agenda' : '/meus-agendamentos'} replace />
}

// Mapa de URL -> página. /login e /cadastro são as únicas rotas
// públicas — tudo dentro de <FnLayout/> passa primeiro por
// <FnRotaProtegida/>, que manda pra /login quem não estiver autenticado
// (ver componentes/RotaProtegida.jsx).
export default function FnApp() {
  return (
    <Routes>
      <Route path="/login" element={<FnLogin />} />
      <Route path="/cadastro" element={<FnCadastro />} />

      <Route
        path="/"
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
    </Routes>
  )
}
