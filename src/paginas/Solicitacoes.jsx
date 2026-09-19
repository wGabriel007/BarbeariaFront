import { useState } from 'react'
import { agendamentosApi } from '../api/agendamentos'
import { barbeirosApi } from '../api/barbeiros'
import { clientesApi } from '../api/clientes'
import { servicosApi } from '../api/servicos'
import { planosApi } from '../api/planos'
import { solicitacoesPlanoApi } from '../api/solicitacoesPlano'
import { useAsync } from '../ganchos/useAsync'
import { FnButton } from '../componentes/ui/Button'
import { FnField, FnInput, FnTextarea } from '../componentes/ui/Field'
import { FnModal } from '../componentes/ui/Modal'
import { FnPageHeader } from '../componentes/ui/PageHeader'
import { FnEmptyState, FnErrorAlert, FnSpinner } from '../componentes/ui/Feedback'

const formatoDataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

// "Hoje" como "AAAA-MM-DD" no fuso LOCAL — evita o mesmo problema de "new
// Date().toISOString().slice(0, 10)" (usa o dia em UTC, que perto da
// meia-noite pode virar amanhã num fuso atrás de UTC, como o do Brasil).
function FnhojeISO() {
  const hoje = new Date()
  const yyyy = hoje.getFullYear()
  const mm = String(hoje.getMonth() + 1).padStart(2, '0')
  const dd = String(hoje.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Sugestão inicial de "data de vencimento": um mês depois da data de
// início — só um ponto de partida, o Admin/Barbeiro pode trocar por
// qualquer outra data. Mesmo cuidado de não passar por toISOString (ver
// FnhojeISO acima).
function FnsomarUmMes(dataISO) {
  const [ano, mes, dia] = dataISO.split('-').map(Number)
  const d = new Date(ano, mes, dia) // mes (sem "-1") já soma 1 mês
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/**
 * "Aba de solicitações": agrupa os dois tipos de pedido que aguardam
 * decisão do staff — horário (FnSecaoSolicitacoesAgendamento, já
 * existia) e plano (FnSecaoSolicitacoesPlano, novo).
 */
export function FnSolicitacoes() {
  return (
    <div className="space-y-10">
      <FnPageHeader
        titulo="Solicitações"
        descricao="Pedidos de horário e de plano feitos pelos clientes, aguardando confirmação."
      />
      <FnSecaoSolicitacoesAgendamento />
      <FnSecaoSolicitacoesPlano />
    </div>
  )
}

/**
 * Pedidos de horário (Status Pendente) feitos pelo próprio cliente
 * (Comum) via "Meus agendamentos", aguardando o barbeiro Fnconfirmar ou
 * Fnrejeitar — com um recado opcional pro cliente em qualquer um dos
 * dois casos (ver AgendamentoService.Confirmar/RejeitarAsync). Um
 * Admin vê as de todos os barbeiros; um Barbeiro só vê as próprias (o
 * back já filtra isso — ver AgendamentosController.ListarPendentes).
 */
function FnSecaoSolicitacoesAgendamento() {
  const { dados: pendentes, carregando, erro, Fnrecarregar } = useAsync(
    () => agendamentosApi.FnlistarPendentes(),
    [],
  )
  const { dados: barbeiros } = useAsync(() => barbeirosApi.Fnlistar(), [])
  const { dados: clientes } = useAsync(() => clientesApi.Fnlistar(), [])
  const { dados: servicos } = useAsync(() => servicosApi.Fnlistar(), [])

  // { agendamento, tipo: 'confirmar' | 'rejeitar' } — controla o modal de
  // recado opcional; null = nenhum modal aberto.
  const [decisao, setDecisao] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroDecisao, setErroDecisao] = useState(null)

  function FnnomeCliente(id) {
    return clientes?.find((c) => c.id === id)?.nomeCompleto ?? `Cliente #${id}`
  }
  function FntelefoneCliente(id) {
    return clientes?.find((c) => c.id === id)?.telefone
  }
  function FnnomeBarbeiro(id) {
    return barbeiros?.find((b) => b.id === id)?.nomeCompleto ?? `Barbeiro #${id}`
  }
  function FnnomeServico(id) {
    return servicos?.find((s) => s.id === id)?.nome ?? `Serviço #${id}`
  }

  function FnabrirDecisao(agendamento, tipo) {
    setDecisao({ agendamento, tipo })
    setMensagem('')
    setErroDecisao(null)
  }

  async function FnconfirmarDecisao(e) {
    e.preventDefault()
    setEnviando(true)
    setErroDecisao(null)

    try {
      const Fnacao = decisao.tipo === 'confirmar' ? agendamentosApi.Fnconfirmar : agendamentosApi.Fnrejeitar
      await Fnacao(decisao.agendamento.id, mensagem || undefined)
      setDecisao(null)
      Fnrecarregar()
    } catch (err) {
      setErroDecisao(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-brand-900">Horários</h2>

      {carregando && <FnSpinner />}
      <FnErrorAlert erro={erro} />

      {pendentes && pendentes.length === 0 && (
        <FnEmptyState>Nenhuma solicitação de horário pendente por aqui.</FnEmptyState>
      )}

      {pendentes && pendentes.length > 0 && (
        <div className="space-y-3">
          {pendentes.map((ag) => (
            <div
              key={ag.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <div className="font-medium text-brand-900">
                  {FnnomeCliente(ag.clienteId)}
                  {FntelefoneCliente(ag.clienteId) && ` · ${FntelefoneCliente(ag.clienteId)}`}
                </div>
                <div className="text-sm text-brand-600">
                  {FnnomeServico(ag.servicoId)} com {FnnomeBarbeiro(ag.barbeiroId)} ·{' '}
                  {formatoDataHora.format(new Date(ag.inicio))} · {formatoMoeda.format(ag.precoCobrado)}
                </div>
                {ag.observacoes && (
                  <div className="mt-1 text-xs text-brand-400">Obs. do cliente: {ag.observacoes}</div>
                )}
              </div>

              <div className="flex gap-2">
                <FnButton variant="ghost" onClick={() => FnabrirDecisao(ag, 'rejeitar')}>
                  Rejeitar
                </FnButton>
                <FnButton onClick={() => FnabrirDecisao(ag, 'confirmar')}>Confirmar</FnButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <FnModal
        titulo={decisao?.tipo === 'confirmar' ? 'Confirmar agendamento' : 'Rejeitar solicitação'}
        aberto={!!decisao}
        onFechar={() => setDecisao(null)}
      >
        {decisao && (
          <form onSubmit={FnconfirmarDecisao} className="space-y-4">
            <p className="text-sm text-brand-600">
              {decisao.tipo === 'confirmar' ? 'Confirmar' : 'Rejeitar'} o horário de{' '}
              <strong>{FnnomeCliente(decisao.agendamento.clienteId)}</strong> em{' '}
              {formatoDataHora.format(new Date(decisao.agendamento.inicio))} com{' '}
              {FnnomeBarbeiro(decisao.agendamento.barbeiroId)}.
            </p>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-brand-800">
                Recado pro cliente (opcional)
              </span>
              <FnTextarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder={
                  decisao.tipo === 'confirmar'
                    ? 'Ex.: Combinado! Te espero lá.'
                    : 'Ex.: Não vou poder nesse horário, tente outro dia.'
                }
              />
            </label>

            <FnErrorAlert erro={erroDecisao ? { message: erroDecisao } : null} />

            <div className="flex justify-end gap-2 pt-2">
              <FnButton type="button" variant="secondary" onClick={() => setDecisao(null)}>
                Cancelar
              </FnButton>
              <FnButton type="submit" disabled={enviando}>
                {enviando ? 'Enviando...' : decisao.tipo === 'confirmar' ? 'Confirmar' : 'Rejeitar'}
              </FnButton>
            </div>
          </form>
        )}
      </FnModal>
    </section>
  )
}

/**
 * Pedidos de plano (Status Pendente) feitos por um usuário Comum via
 * "Planos" → ícone de sino no card. Aceitar exige início/vencimento
 * (isso cria a Assinatura de verdade e promove o usuário a Cliente —
 * ver SolicitacaoPlanoService.AceitarAsync); Rejeitar aceita um recado
 * opcional que aparece pro usuário em "Meus planos".
 */
function FnSecaoSolicitacoesPlano() {
  const { dados: pendentes, carregando, erro, Fnrecarregar } = useAsync(
    () => solicitacoesPlanoApi.FnlistarPendentes(),
    [],
  )
  const { dados: planos } = useAsync(() => planosApi.Fnlistar(), [])

  // { solicitacao, tipo: 'aceitar' | 'rejeitar' } — controla o modal;
  // null = nenhum modal aberto.
  const [decisao, setDecisao] = useState(null)
  const [dataInicio, setDataInicio] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroDecisao, setErroDecisao] = useState(null)

  function FnnomePlano(id) {
    return planos?.find((p) => p.id === id)?.nome ?? `Plano #${id}`
  }

  function FnabrirDecisao(solicitacao, tipo) {
    setDecisao({ solicitacao, tipo })
    const inicio = FnhojeISO()
    setDataInicio(inicio)
    setDataVencimento(FnsomarUmMes(inicio))
    setMensagem('')
    setErroDecisao(null)
  }

  async function FnconfirmarDecisao(e) {
    e.preventDefault()
    setEnviando(true)
    setErroDecisao(null)

    try {
      if (decisao.tipo === 'aceitar') {
        await solicitacoesPlanoApi.Fnaceitar(decisao.solicitacao.id, {
          dataInicio,
          dataVencimento,
        })
      } else {
        await solicitacoesPlanoApi.Fnrejeitar(decisao.solicitacao.id, mensagem || undefined)
      }
      setDecisao(null)
      Fnrecarregar()
    } catch (err) {
      setErroDecisao(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-brand-900">Planos</h2>

      {carregando && <FnSpinner />}
      <FnErrorAlert erro={erro} />

      {pendentes && pendentes.length === 0 && (
        <FnEmptyState>Nenhuma solicitação de plano pendente por aqui.</FnEmptyState>
      )}

      {pendentes && pendentes.length > 0 && (
        <div className="space-y-3">
          {pendentes.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <div className="font-medium text-brand-900">{s.nomeUsuario}</div>
                <div className="text-sm text-brand-600">
                  Quer o plano <strong>{s.nomePlano ?? FnnomePlano(s.planoId)}</strong>
                </div>
                <div className="mt-1 text-xs text-brand-400">
                  Contato: {s.email} · {s.telefone}
                </div>
              </div>

              <div className="flex gap-2">
                <FnButton variant="ghost" onClick={() => FnabrirDecisao(s, 'rejeitar')}>
                  Rejeitar
                </FnButton>
                <FnButton onClick={() => FnabrirDecisao(s, 'aceitar')}>Aceitar</FnButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <FnModal
        titulo={decisao?.tipo === 'aceitar' ? 'Aceitar solicitação de plano' : 'Rejeitar solicitação de plano'}
        aberto={!!decisao}
        onFechar={() => setDecisao(null)}
      >
        {decisao && (
          <form onSubmit={FnconfirmarDecisao} className="space-y-4">
            <p className="text-sm text-brand-600">
              {decisao.tipo === 'aceitar' ? 'Aceitar' : 'Rejeitar'} o pedido de{' '}
              <strong>{decisao.solicitacao.nomeUsuario}</strong> pelo plano{' '}
              <strong>{decisao.solicitacao.nomePlano ?? FnnomePlano(decisao.solicitacao.planoId)}</strong>.
            </p>

            {decisao.tipo === 'aceitar' ? (
              <>
                <p className="text-xs text-brand-400">
                  Ao Fnaceitar, {decisao.solicitacao.nomeUsuario} passa a ser cliente automaticamente e a
                  assinatura já é criada com os dados abaixo.
                </p>
                <FnField label="Data de início">
                  <FnInput
                    type="date"
                    required
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </FnField>
                <FnField label="Data de vencimento" hint="A data certa do próximo pagamento — não precisa mais ser só 'o dia 5', por exemplo.">
                  <FnInput
                    type="date"
                    required
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                  />
                </FnField>
              </>
            ) : (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-brand-800">
                  Recado pro usuário (opcional)
                </span>
                <FnTextarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Ex.: No momento não temos vaga nesse plano."
                />
              </label>
            )}

            <FnErrorAlert erro={erroDecisao ? { message: erroDecisao } : null} />

            <div className="flex justify-end gap-2 pt-2">
              <FnButton type="button" variant="secondary" onClick={() => setDecisao(null)}>
                Cancelar
              </FnButton>
              <FnButton type="submit" disabled={enviando}>
                {enviando ? 'Enviando...' : decisao.tipo === 'aceitar' ? 'Aceitar' : 'Rejeitar'}
              </FnButton>
            </div>
          </form>
        )}
      </FnModal>
    </section>
  )
}
