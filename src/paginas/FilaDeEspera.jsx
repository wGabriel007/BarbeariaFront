import { agendamentosApi } from '../api/agendamentos'
import { useAuth } from '../contexto/AuthContext'
import { useAsync } from '../ganchos/useAsync'
import { FnPageHeader } from '../componentes/ui/PageHeader'
import { FnEmptyState, FnErrorAlert, FnSpinner } from '../componentes/ui/Feedback'

const formatoHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

// Rótulo mais natural que o nome puro do enum StatusAgendamento pra
// quem está sendo atendido AGORA — os outros itens da fila (Confirmado)
// já ficam claros só pela posição numerada, não precisam de rótulo
// especial.
function FnrotuloStatus(status) {
  return status === 'EmAtendimento' ? 'Sendo atendido agora' : null
}

/**
 * "Quem está na minha frente" — funciona pras TRÊS pontas da mesma fila
 * (ver AgendamentoService.FnListarMinhaFilaAsync):
 *   - CLIENTE: minhaPosicao > 0 — a lista inteira de quem está antes
 *     dele, igual a pessoa veria fisicamente numa barbearia de verdade.
 *   - BARBEIRO (com agenda própria): minhaPosicao === 0 (não é um dos
 *     clientes esperando, então não tem "posição") — a própria fila de
 *     hoje, pra ele acompanhar sem precisar abrir a Agenda. Só uma seção
 *     (a fila dele mesmo).
 *   - ADMIN puro (sem cadastro de Barbeiro/Cliente): também
 *     minhaPosicao === 0 em cada item, mas pode vir MAIS DE UMA seção —
 *     uma por barbeiro que tenha alguém esperando hoje, visão geral do
 *     salão inteiro.
 * Em todos os casos só aparece algo se houver pelo menos um agendamento
 * CONFIRMADO hoje — ainda Pendente/Agendado (staff não confirmou) ou de
 * outro dia não entra na fila.
 */
export function FnFilaDeEspera() {
  const { ehStaff, usuario } = useAuth()
  const { dados: filas, carregando, erro } = useAsync(() => agendamentosApi.FnlistarMinhaFila(), [])

  // Só um Admin "puro" (sem cadastro de Barbeiro próprio) recebe a fila
  // de TODOS os barbeiros de uma vez (ver FnListarFilaDeTodosOsBarbeirosAsync
  // no back) — um Barbeiro (mesmo que também seja Admin) sempre recebe
  // só a própria seção, então esse rótulo continua sendo "Sua fila de
  // hoje" pra ele. Usamos o Tipo da conta, não a quantidade de seções,
  // porque um cliente comum também pode ter mais de uma seção (um
  // agendamento hoje com cada um de dois barbeiros diferentes).
  const souAdmin = usuario?.tipo === 'Admin'

  return (
    <div className="space-y-8">
      <FnPageHeader
        titulo="Fila de espera"
        descricao={
          souAdmin
            ? 'A fila de hoje de cada barbeiro, na ordem de horário — quem já confirmou e está esperando ou sendo atendido.'
            : ehStaff
              ? 'Sua fila de hoje, na ordem de horário — quem já confirmou e está esperando ou sendo atendido.'
              : 'Quem está na sua frente, na ordem de horário, pros seus agendamentos confirmados de hoje.'
        }
      />

      {carregando && <FnSpinner />}
      <FnErrorAlert erro={erro} />

      {filas && filas.length === 0 && !carregando && (
        <FnEmptyState>
          {souAdmin
            ? 'Nenhum cliente confirmado esperando hoje, com nenhum barbeiro.'
            : ehStaff
              ? 'Nenhum cliente confirmado esperando hoje — a fila aparece aqui assim que você confirmar um horário.'
              : 'Você não tem nenhum agendamento confirmado para hoje — a fila só aparece depois que o barbeiro confirma o horário.'}
        </FnEmptyState>
      )}

      {(filas ?? []).map((fila) => {
        // minhaPosicao === 0 é o sinal (vindo do back) de que esta lista
        // é a visão do BARBEIRO/Admin — ele não é um cliente esperando,
        // então não faz sentido mostrar "você é o Nº de M" nem destacar
        // "Você" num item da lista (souEu vem sempre false nesse caso).
        const visaoBarbeiro = fila.minhaPosicao === 0

        return (
          <section key={fila.barbeiroId} className="rounded-xl border border-brand-200 bg-surface p-5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-brand-900">
                {visaoBarbeiro ? (souAdmin ? `Fila de ${fila.nomeBarbeiro}` : 'Sua fila de hoje') : `Fila com ${fila.nomeBarbeiro}`}
              </h2>
              <p className="text-sm text-brand-500">
                {visaoBarbeiro ? (
                  <>
                    <strong>{fila.totalNaFila}</strong> {fila.totalNaFila === 1 ? 'pessoa' : 'pessoas'} na fila
                  </>
                ) : (
                  <>
                    Você é o <strong>{fila.minhaPosicao}º</strong> de {fila.totalNaFila}
                  </>
                )}
              </p>
            </div>

            {!visaoBarbeiro && fila.minhaPosicao === 1 && (
              <div className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                Você é o próximo da vez!
              </div>
            )}

            <ol className="space-y-2">
              {fila.itens.map((item, indice) => (
                <li
                  key={item.agendamentoId}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${
                    item.souEu
                      ? 'border-brand-700 bg-brand-50'
                      : 'border-brand-100 bg-brand-50/40'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      item.souEu ? 'bg-brand-700 text-white' : 'bg-brand-200 text-brand-700'
                    }`}
                  >
                    {indice + 1}º
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-brand-900">
                      {item.souEu ? 'Você' : item.nomeCliente}
                    </div>
                    {FnrotuloStatus(item.status) && (
                      <div className="text-xs text-brand-500">{FnrotuloStatus(item.status)}</div>
                    )}
                  </div>
                  <div className="shrink-0 text-xs text-brand-400">{formatoHora.format(new Date(item.inicio))}</div>
                </li>
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
