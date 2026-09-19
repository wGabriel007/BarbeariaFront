import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { agendamentosApi } from '../api/agendamentos'
import { barbeirosApi } from '../api/barbeiros'
import { servicosApi } from '../api/servicos'
import { useAsync } from '../ganchos/useAsync'
import { useToastErro } from '../ganchos/useToastErro'
import { useAuth } from '../contexto/AuthContext'
import { FnmarcarComoVisto } from '../utilitarios/notificacoes'
import { FnButton } from '../componentes/ui/Button'
import { useConfirmacao } from '../componentes/ui/ConfirmDialog'
import { FnField, FnInput, FnSelect, FnTextarea } from '../componentes/ui/Field'
import { FnBadge } from '../componentes/ui/Badge'
import { FnModal } from '../componentes/ui/Modal'
import { FnPageHeader } from '../componentes/ui/PageHeader'
import { FnEmptyState, FnErrorAlert, FnSpinner } from '../componentes/ui/Feedback'
import { FnToast } from '../componentes/ui/Toast'

// Mesma grafia que o back manda em HorarioResponse.diaSemana (nome do
// enum DiaSemana em C#, sem acento — "Terca", "Sabado") — índice = o que
// Date.prototype.getDay() devolve (0=domingo...6=sábado), então dá pra
// usar esse array pra ir de "getDay()" direto pro texto que a Api usa.
const DIAS_SEMANA_API = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']

const formatoDataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})
const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// Só esses status ainda "valem a pena" Fncancelar — os outros já são
// definitivos (Concluido/Cancelado/Rejeitado/NaoCompareceu).
const CANCELAVEIS = ['Pendente', 'Confirmado', 'Agendado']

/**
 * Tela do CLIENTE (Comum): pedir um novo horário (que nasce Pendente,
 * aguardando o barbeiro Fnconfirmar — ver Solicitacoes.jsx do lado do
 * staff) e acompanhar/Fncancelar os próprios pedidos. Diferente da FnAgenda
 * (staff-only), aqui não aparece o agendamento de MAIS NINGUÉM — só os
 * do próprio usuário logado (ver AgendamentosController.ListarMeus).
 */
export function FnMeusAgendamentos() {
  const { usuario } = useAuth()
  const { dados: meus, carregando, erro, Fnrecarregar } = useAsync(
    () => agendamentosApi.FnlistarMeus(),
    [],
  )
  const { dados: barbeiros } = useAsync(() => barbeirosApi.Fnlistar(), [])
  const { dados: servicos } = useAsync(() => servicosApi.Fnlistar(), [])

  // "Fila de hoje" (ver AgendamentoService.ListarMinhaFilaAsync) — uma
  // entrada por agendamento de HOJE já Confirmado, com posição/total já
  // calculados (a lista completa, com nome de quem está na frente, mora
  // em paginas/FilaDeEspera.jsx — aqui só o resumo). Vira um mapa pelo
  // próprio agendamento só pra ficar fácil de consultar na hora de
  // desenhar cada card abaixo.
  const { dados: filas } = useAsync(() => agendamentosApi.FnlistarMinhaFila(), [])
  const filaPorAgendamento = useMemo(() => {
    const mapa = new Map()
    for (const fila of filas ?? []) mapa.set(fila.meuAgendamentoId, fila)
    return mapa
  }, [filas])

  // Abrir esta tela já "consome" a bolinha de notificação do menu (ver
  // Layout.jsx e utilitarios/notificacoes.js): registra agora como a última
  // vez que a pessoa viu a lista, então só agendamentos alterados DEPOIS
  // deste momento voltam a acender a bolinha. Depende de `meus` (não só
  // de montar o componente) pra não marcar "visto" antes da lista
  // realmente ter carregado.
  useEffect(() => {
    if (!usuario || !meus) return
    FnmarcarComoVisto(usuario.id, 'meus-agendamentos')
  }, [usuario, meus])

  // A aba "Barbeiros" mostra todo mundo, ausente ou não (ver
  // BarbeirosController.Listar) — mas aqui, na hora de ESCOLHER um
  // barbeiro pra um horário novo, quem está ausente nem aparece: evita
  // o cliente escolher e só descobrir com um erro do back que esse
  // barbeiro não está recebendo solicitação hoje.
  const barbeirosDisponiveis = (barbeiros ?? []).filter((b) => !b.ausente)

  const [modalAberto, setModalAberto] = useState(false)
  const { Fnconfirmar, elemento: dialogoConfirmacao } = useConfirmacao()
  const { erro: erroAcao, FnmostrarErro, FnfecharErro } = useToastErro()

  function FnnomeBarbeiro(id) {
    return barbeiros?.find((b) => b.id === id)?.nomeCompleto ?? `Barbeiro #${id}`
  }
  function FnnomeServico(id) {
    return servicos?.find((s) => s.id === id)?.nome ?? `Serviço #${id}`
  }

  async function Fncancelar(agendamento) {
    const confirmado = await Fnconfirmar('Cancelar este agendamento?', {
      textoConfirmar: 'Cancelar agendamento',
      variant: 'danger',
    })
    if (!confirmado) return
    try {
      await agendamentosApi.Fncancelar(agendamento.id)
      Fnrecarregar()
    } catch (err) {
      FnmostrarErro(err.message)
    }
  }

  const meusOrdenados = (meus ?? []).slice().sort((a, b) => new Date(b.inicio) - new Date(a.inicio))

  return (
    <div>
      <FnPageHeader
        titulo="Meus agendamentos"
        descricao="Peça um horário com o barbeiro e acompanhe se já foi confirmado."
        Fnacao={<FnButton onClick={() => setModalAberto(true)}>+ Solicitar agendamento</FnButton>}
      />

      {carregando && <FnSpinner />}
      <FnErrorAlert erro={erro} />

      {meusOrdenados.length === 0 && !carregando && (
        <FnEmptyState>Você ainda não tem nenhum agendamento. Que tal solicitar um?</FnEmptyState>
      )}

      {meusOrdenados.length > 0 && (
        <div className="space-y-3">
          {meusOrdenados.map((ag) => {
            const naFila = filaPorAgendamento.get(ag.id)
            return (
              <div
                key={ag.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <div className="font-medium text-brand-900">
                    {FnnomeServico(ag.servicoId)} com {FnnomeBarbeiro(ag.barbeiroId)}
                  </div>
                  <div className="text-sm text-brand-600">
                    {formatoDataHora.format(new Date(ag.inicio))} · {formatoMoeda.format(ag.precoCobrado)}
                  </div>
                  {/* Só existe pra agendamentos de HOJE já Confirmados (ver
                      ListarMinhaFilaAsync) — "minhaPosicao === 1" é o
                      mesmo critério que dispara o aviso "Você é o
                      próximo da vez" em Layout.jsx, aqui só mostrado
                      direto na tela em vez de esperar o aviso passar. O
                      link vai pra "Fila de espera", que mostra a lista
                      inteira (com nome de quem está na frente). */}
                  {naFila && (
                    <div
                      className={`mt-1 flex items-center gap-2 text-xs font-medium ${
                        naFila.minhaPosicao === 1 ? 'text-green-600' : 'text-brand-500'
                      }`}
                    >
                      <span>
                        {naFila.minhaPosicao === 1
                          ? 'Você é o próximo da vez!'
                          : `Fila de hoje: você é o ${naFila.minhaPosicao}º de ${naFila.totalNaFila}`}
                      </span>
                      <Link to="/fila-de-espera" className="underline hover:text-brand-700">
                        Ver fila
                      </Link>
                    </div>
                  )}
                  {ag.observacoes && (
                    <div className="mt-1 text-xs text-brand-400">Sua observação: {ag.observacoes}</div>
                  )}
                  {ag.mensagemResposta && (
                    <div className="mt-1 text-xs text-brand-500">
                      Recado do barbeiro: "{ag.mensagemResposta}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <FnBadge status={ag.status} />
                  {CANCELAVEIS.includes(ag.status) && (
                    <FnButton variant="ghost" onClick={() => Fncancelar(ag)}>
                      Cancelar
                    </FnButton>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <FnNovaSolicitacaoModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        barbeiros={barbeirosDisponiveis}
        servicos={servicos ?? []}
        onCriado={() => {
          setModalAberto(false)
          Fnrecarregar()
        }}
      />

      {dialogoConfirmacao}
      <FnToast aberto={!!erroAcao} mensagem={erroAcao ?? ''} tipo="erro" onFechar={FnfecharErro} />
    </div>
  )
}

function FnNovaSolicitacaoModal({ aberto, onFechar, barbeiros, servicos, onCriado }) {
  const [form, setForm] = useState({ barbeiroId: '', servicoId: '', data: '', hora: '', observacoes: '' })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  const barbeiroEscolhido = barbeiros.find((b) => String(b.id) === String(form.barbeiroId))

  // Horários cadastrados do barbeiro escolhido, pro dia da semana da
  // data escolhida — só um GUIA visual (o back é quem valida de
  // verdade, ver AgendamentoService.SolicitarAsync). Construído com
  // T00:00:00 (hora local) em vez de só "data" pra não cair na pegadinha
  // clássica do JS de interpretar "AAAA-MM-DD" como UTC e mostrar o dia
  // da semana errado perto da virada.
  const horariosDoDia = useMemo(() => {
    if (!barbeiroEscolhido || !form.data) return []
    const diaSemanaEscolhido = DIAS_SEMANA_API[new Date(`${form.data}T00:00:00`).getDay()]
    return barbeiroEscolhido.horarios.filter((h) => h.diaSemana === diaSemanaEscolhido)
  }, [barbeiroEscolhido, form.data])

  async function Fnsalvar(e) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)

    try {
      const inicio = new Date(`${form.data}T${form.hora}:00`)

      await agendamentosApi.Fnsolicitar({
        barbeiroId: Number(form.barbeiroId),
        servicoId: Number(form.servicoId),
        inicio: inicio.toISOString(),
        observacoes: form.observacoes || null,
      })
      setForm({ barbeiroId: '', servicoId: '', data: '', hora: '', observacoes: '' })
      onCriado()
    } catch (err) {
      // Aqui aparecem tanto o 400 ("fora do expediente") quanto o 409
      // ("já tem agendamento/solicitação nesse horário") — ver
      // ExceptionHandlingMiddleware/client.js.
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <FnModal titulo="Solicitar agendamento" aberto={aberto} onFechar={onFechar}>
      <form onSubmit={Fnsalvar} className="space-y-4">
        <FnField label="Barbeiro">
          <FnSelect
            required
            value={form.barbeiroId}
            onChange={(e) => setForm({ ...form, barbeiroId: e.target.value })}
          >
            <option value="">Selecione...</option>
            {barbeiros.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nomeCompleto}
              </option>
            ))}
          </FnSelect>
        </FnField>

        <FnField label="Serviço">
          <FnSelect
            required
            value={form.servicoId}
            onChange={(e) => setForm({ ...form, servicoId: e.target.value })}
          >
            <option value="">Selecione...</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} ({s.duracaoMinutos} min)
              </option>
            ))}
          </FnSelect>
        </FnField>

        <div className="grid grid-cols-2 gap-4">
          <FnField label="Data">
            <FnInput
              type="date"
              required
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
            />
          </FnField>
          <FnField
            label="Hora"
            hint={
              barbeiroEscolhido && form.data
                ? horariosDoDia.length > 0
                  ? `Expediente nesse dia: ${horariosDoDia.map((h) => `${h.horaInicio.slice(0, 5)}–${h.horaFim.slice(0, 5)}`).join(', ')}`
                  : 'Este barbeiro não atende nesse dia da semana.'
                : undefined
            }
          >
            <FnInput
              type="time"
              required
              value={form.hora}
              onChange={(e) => setForm({ ...form, hora: e.target.value })}
            />
          </FnField>
        </div>

        <FnField label="Observações (opcional)">
          <FnTextarea
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            placeholder="Ex.: prefiro corte bem baixo"
          />
        </FnField>

        <FnErrorAlert erro={erro ? { message: erro } : null} />

        <div className="flex justify-end gap-2 pt-2">
          <FnButton type="button" variant="secondary" onClick={onFechar}>
            Cancelar
          </FnButton>
          <FnButton type="submit" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Solicitar'}
          </FnButton>
        </div>
      </form>
    </FnModal>
  )
}
