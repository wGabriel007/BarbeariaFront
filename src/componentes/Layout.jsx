import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexto/AuthContext'
import { FnurlArquivo } from '../api/client'
import { useTema } from '../ganchos/useTema'
import { useConfiguracaoSite } from '../contexto/ConfiguracaoSiteContext'
import { FnrotuloTipoUsuario } from '../utilitarios/usuario'
import {
  FnobterUltimaVisualizacao,
  FnjaAvisouProximoDaVez,
  FnmarcarProximoDaVezAvisado,
} from '../utilitarios/notificacoes'
import { agendamentosApi } from '../api/agendamentos'
import { solicitacoesPlanoApi } from '../api/solicitacoesPlano'
import { assinaturasApi } from '../api/assinaturas'
import { FnAvatar } from './ui/Avatar'
import { FnToast } from './ui/Toast'
import {
  FnIconCalendario,
  FnIconCarteirinha,
  FnIconChave,
  FnIconClipboard,
  FnIconEquipe,
  FnIconFila,
  FnIconIdentificacao,
  FnIconLoja,
  FnIconLogo,
  FnIconMenu,
  FnIconMoeda,
  FnIconPincel,
  FnIconSair,
  FnIconSino,
  FnIconTema,
  FnIconTesoura,
  FnIconTrofeu,
  FnIconUsuario,
  FnIconX,
} from './ui/Icons'

// Cada item da barra lateral, na ordem que faz sentido pro fluxo de
// trabalho de um dia (agenda primeiro, cadastros depois). "somenteStaff"
// esconde o item pra quem logou como Comum — gestão do negócio (contas
// de acesso, status de pagamento) é tarefa de Admin/Barbeiro, que têm o
// mesmo nível de acesso entre si (ver useAuth().ehStaff). "somenteComum"
// é o inverso — item que só existe pra quem NÃO é staff.
const ITENS_MENU = [
  // FnAgenda mostra o dia inteiro de UM barbeiro, com nome/serviço/preço de
  // TODOS os clientes dele — por isso é staff-only (ver
  // AgendamentosController.ListarPorBarbeiroEPeriodo). Um Comum usa
  // "Meus agendamentos" pra pedir/acompanhar o PRÓPRIO horário.
  { to: '/agenda', label: 'Agenda', FnIcone: FnIconCalendario, somenteStaff: true },
  { to: '/meus-agendamentos', label: 'Meus agendamentos', FnIcone: FnIconClipboard },
  // "Quem está na minha frente" — a versão do cliente da mesma fila que
  // o barbeiro já vê numerada na FnAgenda (ver
  // AgendamentoService.ListarMinhaFilaAsync/paginas/FilaDeEspera.jsx). Sem
  // somenteStaff/somenteComum: um Barbeiro que também seja cliente
  // (raro, mas possível) pode ter o próprio corte marcado e quer saber
  // sua posição igual qualquer outro cliente.
  { to: '/fila-de-espera', label: 'Fila de espera', FnIcone: FnIconFila },
  // "Aba de solicitações": pedidos de horário (Pendente) de clientes
  // Comum, aguardando o barbeiro Fnconfirmar ou Fnrejeitar.
  { to: '/solicitacoes', label: 'Solicitações', FnIcone: FnIconSino, somenteStaff: true },
  // Lista de clientes é dado de negócio (telefone, etc.) — só Admin/Barbeiro
  // veem essa aba, igual FnPagamentos/Usuários (ver ClientesController).
  { to: '/clientes', label: 'Clientes', FnIcone: FnIconUsuario, somenteStaff: true },
  { to: '/servicos', label: 'Serviços', FnIcone: FnIconTesoura },
  { to: '/barbeiros', label: 'Barbeiros', FnIcone: FnIconEquipe },
  // Sem somenteStaff/somenteComum: o ranking existe pra incentivar o
  // CLIENTE a torcer por um barbeiro e voltar mais vezes, não é uma tela
  // de gestão — todo mundo vê o mesmo pódio (ver RankingController na Api).
  { to: '/ranking', label: 'Ranking', FnIcone: FnIconTrofeu },
  { to: '/planos', label: 'Planos de assinatura', FnIcone: FnIconClipboard },
  // Detalhe da própria assinatura (status, renovar, Fncancelar) — só faz
  // sentido pra quem tem (ou pode vir a ter) uma assinatura própria, ou
  // seja, um Comum. Staff gerencia assinatura de qualquer cliente pela
  // seção "Assinaturas por cliente" em FnPlanos de assinatura.
  { to: '/meu-plano', label: 'Meu plano', FnIcone: FnIconCarteirinha, somenteComum: true },
  { to: '/pagamentos', label: 'Pagamentos', FnIcone: FnIconMoeda, somenteStaff: true },
  { to: '/usuarios', label: 'Usuários', FnIcone: FnIconChave, somenteStaff: true },
  // Sem somenteStaff/somenteComum: "Meu perfil" existe pra todo mundo,
  // Admin/Barbeiro/Comum — cada um só vê e edita os PRÓPRIOS dados (ver
  // paginas/Perfil.jsx e PerfilController na Api).
  { to: '/perfil', label: 'Meu perfil', FnIcone: FnIconIdentificacao },
  // Logo/cor do site: decisão de dono do negócio, não tarefa de
  // Barbeiro — por isso "somenteAdmin" e não "somenteStaff" (ver
  // RotaProtegida.jsx e paginas/ConfiguracaoAparencia.jsx).
  { to: '/aparencia', label: 'Aparência', FnIcone: FnIconPincel, somenteAdmin: true },
  // Local, contato, fotos do espaço e perfil profissional de quem
  // atende: sem somenteStaff/somenteComum de propósito — todo mundo vê
  // (inclusive Comum/Cliente), só que em modo de visualização; Admin E
  // Barbeiro editam igualmente por dentro da própria página (ver
  // paginas/SobreABarbearia.jsx).
  { to: '/sobre-barbearia', label: 'Sobre a barbearia', FnIcone: FnIconLoja },
]

// Layout.jsx é o "molde" da aplicação: barra lateral + o conteúdo da
// rota atual (via <Outlet/>, do react-router). Toda página em src/pages
// entra dentro desse molde — nenhuma delas precisa desenhar a barra
// lateral de novo.
//
// Em telas largas (lg+, "desktop") a barra fica sempre visível, lado a
// lado com o conteúdo — igual sempre foi. Em telas estreitas (celular),
// não cabem as duas coisas ao mesmo tempo: a barra vira um menu que
// começa fechado (fora da tela, à esquerda) e abre por cima do conteúdo
// quando o botão de "hamburguer" na barra superior é tocado, com um
// fundo escurecido atrás que fecha o menu ao ser tocado.
// Cada quantos ms checar se tem notificação nova — não precisa ser em
// tempo real (o site não tem WebSocket/push), só rápido o bastante pra
// alguém sentado na tela perceber uma solicitação nova sem precisar dar
// F5. 25s é um meio-termo: perto o bastante de "na hora" sem martelar a
// Api com requisição toda hora.
const INTERVALO_NOTIFICACOES_MS = 25_000

export function FnLayout() {
  const { usuario, Fnlogout, ehStaff } = useAuth()
  const { config } = useConfiguracaoSite()
  const { escuro, Fnalternar: alternarTema } = useTema()
  const itensVisiveis = ITENS_MENU.filter(
    (item) =>
      (!item.somenteStaff || ehStaff) &&
      (!item.somenteComum || !ehStaff) &&
      (!item.somenteAdmin || usuario?.tipo === 'Admin'),
  )
  const [menuAberto, setMenuAberto] = useState(false)
  const nomeBarbearia = config?.nomeBarbearia ?? 'Barbearia'

  // Três bolinhas vermelhas de notificação, cada uma com sua própria
  // ideia do que é "novo" — nenhuma guarda estado próprio no banco,
  // todas são recalculadas a partir de dado que já existe:
  //
  // 1. "Solicitações" (só Admin/Barbeiro): pedidos Pendentes agora mesmo
  //    — de horário E de plano juntos, já que a aba mostra as duas
  //    seções (ver Solicitacoes.jsx). Não precisa de "marcar como
  //    visto" — o próprio ato de Fnconfirmar/Fnrejeitar já tira o item da
  //    lista, então a contagem se resolve sozinha.
  // 2. "Meus agendamentos" (todo mundo — até staff pode ter os próprios
  //    cortes marcados): quantos agendamentos foram alterados
  //    (confirmado, rejeitado, cancelado...) depois da última vez que a
  //    pessoa abriu essa aba (ver utilitarios/notificacoes.js e
  //    MeusAgendamentos.jsx, que marca "visto" ao carregar a lista).
  // 3. "Meu plano" (só Comum, é a única aba que só ele vê — ver
  //    ITENS_MENU): mesma ideia da anterior, só que olhando pedidos de
  //    plano E assinaturas próprias (uma renovação aceita muda as duas,
  //    um Suspender/Cancelar do staff muda só a assinatura).
  const [pendentes, setPendentes] = useState(0)
  const [agendamentosNaoVistos, setAgendamentosNaoVistos] = useState(0)
  const [planoNaoVisto, setPlanoNaoVisto] = useState(0)

  // "Você é o próximo da vez!" — diferente das três bolinhas acima
  // (contagem persistente até a pessoa ver a aba), este é um AVISO
  // pontual: aparece uma vez, no instante em que a fila de hoje (ver
  // AgendamentoService.ListarMinhaFilaAsync) muda pra posição 1, e some
  // sozinho depois de alguns segundos — não fica "pendente" esperando
  // alguém abrir alguma aba específica.
  const [avisoProximo, setAvisoProximo] = useState(null)

  useEffect(() => {
    if (!usuario) return
    let cancelado = false

    async function FnverificarNotificacoes() {
      try {
        if (ehStaff) {
          const [pendentesAgendamento, pendentesPlano] = await Promise.all([
            agendamentosApi.FnlistarPendentes(),
            solicitacoesPlanoApi.FnlistarPendentes(),
          ])
          if (!cancelado) setPendentes(pendentesAgendamento.length + pendentesPlano.length)
        } else {
          // "Meu plano" só existe pra quem não é staff (ver ITENS_MENU) —
          // sem sentido gastar essas duas requisições pra Admin/Barbeiro.
          const [meusPedidosPlano, minhasAssinaturas] = await Promise.all([
            solicitacoesPlanoApi.FnlistarMeus(),
            assinaturasApi.FnlistarMinhas(),
          ])
          if (cancelado) return
          const ultimaVistaPlano = FnobterUltimaVisualizacao(usuario.id, 'meu-plano')
          const pedidosAlterados = meusPedidosPlano.filter((s) => new Date(s.atualizadoEm) > ultimaVistaPlano).length
          const assinaturasAlteradas = minhasAssinaturas.filter(
            (a) => new Date(a.atualizadoEm) > ultimaVistaPlano,
          ).length
          setPlanoNaoVisto(pedidosAlterados + assinaturasAlteradas)
        }

        const meus = await agendamentosApi.FnlistarMeus()
        if (cancelado) return
        const ultimaVista = FnobterUltimaVisualizacao(usuario.id, 'meus-agendamentos')
        setAgendamentosNaoVistos(meus.filter((ag) => new Date(ag.atualizadoEm) > ultimaVista).length)

        // Fila de hoje: se algum agendamento virou o Nº 1 e ainda não
        // avisamos sobre ESSE agendamento específico, dispara o aviso e
        // marca como avisado — senão ele voltaria a aparecer a cada 25s
        // enquanto a pessoa continuar sendo a próxima da vez. Cada item
        // de 'filas' é a fila inteira de UM barbeiro (ver
        // FilaDoBarbeiroResponse) — aqui só interessa minhaPosicao.
        const filas = await agendamentosApi.FnlistarMinhaFila()
        if (cancelado) return
        const proximo = filas.find(
          (f) => f.minhaPosicao === 1 && !FnjaAvisouProximoDaVez(f.meuAgendamentoId),
        )
        if (proximo) {
          FnmarcarProximoDaVezAvisado(proximo.meuAgendamentoId)
          setAvisoProximo('Você é o próximo da vez!')
        }
      } catch {
        // Notificação é um extra — se a checagem falhar (rede, etc.), a
        // pessoa só não vê a bolinha dessa vez, sem popup de erro
        // atrapalhando a navegação normal.
      }
    }

    FnverificarNotificacoes()
    const id = setInterval(FnverificarNotificacoes, INTERVALO_NOTIFICACOES_MS)
    return () => {
      cancelado = true
      clearInterval(id)
    }
  }, [usuario, ehStaff])

  const notificacoesPorRota = {
    '/solicitacoes': pendentes,
    '/meus-agendamentos': agendamentosNaoVistos,
    '/meu-plano': planoNaoVisto,
  }
  const totalNotificacoes = pendentes + agendamentosNaoVistos + planoNaoVisto

  return (
    <div className="min-h-screen bg-brand-50 lg:flex">
      {/* Barra superior só existe no celular/tablet — no desktop a barra
          lateral já fica sempre visível, então essa aqui não faz falta. */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-200 bg-surface px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <FnLogoBarbearia config={config} className="h-6 w-6" />
          <span className="text-base font-bold text-brand-900">{nomeBarbearia}</span>
        </div>
        <div className="flex items-center gap-1">
          <FnBotaoTema escuro={escuro} onClick={alternarTema} />
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            className="relative rounded-lg p-2 text-brand-700 transition-colors hover:bg-brand-100"
            aria-label={totalNotificacoes > 0 ? 'Abrir menu (há notificações novas)' : 'Abrir menu'}
          >
            <FnIconMenu className="h-6 w-6" />
            {/* No celular o menu começa fechado, então sem isso ninguém
                percebe que tem novidade lá dentro até abrir por curiosidade
                — a bolinha na barra superior avisa antes disso. */}
            {totalNotificacoes > 0 && (
              <span
                className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-surface"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </header>

      {/* Fundo escurecido atrás do menu aberto — só no celular/tablet
          (no desktop o menu nunca "abre por cima", já está sempre lá). */}
      {menuAberto && (
        <div
          className="fixed inset-0 z-40 bg-black/40 animate-fade-in lg:hidden"
          onClick={() => setMenuAberto(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-brand-200 bg-surface transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-60 lg:translate-x-0 ${
          menuAberto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-6">
          <div className="flex items-center gap-2">
            <FnLogoBarbearia config={config} className="h-7 w-7" />
            <div>
              <h1 className="text-lg font-bold leading-tight text-brand-900">{nomeBarbearia}</h1>
              <p className="text-xs text-brand-400">painel de gestão</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* No celular a troca de tema já está na barra superior — aqui
                dentro do menu ela só aparece no desktop, onde não existe
                aquela barra (ver header lá em cima, com lg:hidden). */}
            <FnBotaoTema escuro={escuro} onClick={alternarTema} className="hidden lg:inline-flex" />
            {/* Fechar o menu só faz sentido no celular/tablet — no desktop
                ele nunca fica "aberto por cima", então some com lg:hidden. */}
            <button
              type="button"
              onClick={() => setMenuAberto(false)}
              className="rounded-full p-1 text-brand-400 transition-colors hover:bg-brand-100 hover:text-brand-700 lg:hidden"
              aria-label="Fechar menu"
            >
              <FnIconX className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {itensVisiveis.map((item) => {
            // 0 pra qualquer item sem contador próprio (só Solicitações e
            // Meus agendamentos têm um — ver notificacoesPorRota acima).
            const notificacoes = notificacoesPorRota[item.to] ?? 0
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                // No celular, tocar num item navega E fecha o menu — sem
                // isso, o menu ficaria aberto tampando a página nova.
                onClick={() => setMenuAberto(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-700 text-white'
                      : 'text-brand-700 hover:bg-brand-100'
                  }`
                }
              >
                <item.FnIcone className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {notificacoes > 0 && (
                  <span
                    className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white"
                    aria-label={`${notificacoes} notificação${notificacoes > 1 ? 'ões' : ''} nova${notificacoes > 1 ? 's' : ''}`}
                  >
                    {notificacoes > 9 ? '9+' : notificacoes}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-brand-100 p-3">
          {/* O cartão inteiro é um atalho pra "Meu perfil" — a foto/nome
              já dão o convite visual pra clicar, sem precisar de mais um
              item na navegação principal só pra isso. */}
          <Link
            to="/perfil"
            onClick={() => setMenuAberto(false)}
            className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-brand-100"
          >
            <FnAvatar nome={usuario?.nomeCompleto} fotoUrl={usuario?.fotoUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-brand-900">{usuario?.nomeCompleto}</p>
              <p className="truncate text-xs text-brand-400">{FnrotuloTipoUsuario(usuario)}</p>
            </div>
          </Link>
          <button
            onClick={Fnlogout}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-100"
          >
            <FnIconSair className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Fica aqui no molde (não dentro de alguma página) de propósito —
          assim o aviso "Você é o próximo da vez" aparece pra pessoa não
          importa onde ela estiver navegando no site, não só se estiver
          parada em "Meus agendamentos". */}
      <FnToast
        aberto={!!avisoProximo}
        mensagem={avisoProximo ?? ''}
        onFechar={() => setAvisoProximo(null)}
        duracaoMs={10_000}
      />
    </div>
  )
}

// Logo customizada pelo Admin (ver paginas/ConfiguracaoAparencia.jsx) se
// existir, senão o ícone padrão do sistema — mesmo fallback usado em
// componentes/AuthLayout.jsx (tela de FnLogin), então as duas telas nunca
// ficam com marcas diferentes entre si.
function FnLogoBarbearia({ config, className }) {
  if (config?.logoUrl) {
    return <img src={FnurlArquivo(config.logoUrl)} alt={config.nomeBarbearia ?? 'Logo'} className={`shrink-0 rounded object-contain ${className}`} />
  }

  return <FnIconLogo className={`shrink-0 text-brand-700 ${className}`} />
}

function FnBotaoTema({ escuro, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg p-2 text-brand-700 transition-colors hover:bg-brand-100 ${className}`}
      aria-label={escuro ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={escuro ? 'Modo claro' : 'Modo escuro'}
    >
      <FnIconTema escuro={escuro} className="h-5 w-5" />
    </button>
  )
}
