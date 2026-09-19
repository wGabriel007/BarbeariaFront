import { useMemo, useState } from 'react'
import { agendamentosApi } from '../api/agendamentos'
import { barbeirosApi } from '../api/barbeiros'
import { clientesApi } from '../api/clientes'
import { servicosApi } from '../api/servicos'
import { useAsync } from '../ganchos/useAsync'
import { useToastErro } from '../ganchos/useToastErro'
import { FnButton } from '../componentes/ui/Button'
import { FnField, FnInput, FnSelect, FnTextarea } from '../componentes/ui/Field'
import { FnBadge } from '../componentes/ui/Badge'
import { FnModal } from '../componentes/ui/Modal'
import { FnPageHeader } from '../componentes/ui/PageHeader'
import { FnEmptyState, FnErrorAlert, FnSpinner } from '../componentes/ui/Feedback'
import { FnToast } from '../componentes/ui/Toast'
import { FnIconChevronDireita, FnIconChevronEsquerda } from '../componentes/ui/Icons'
import { useAuth } from '../contexto/AuthContext'

const formatoHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// Qual botão de transição de estado mostrar em cada status — espelha
// exatamente a máquina de estados de Agendamento (Domain):
// Agendado -> Confirmado -> EmAtendimento -> Concluido, com
// Cancelar/NaoCompareceu podendo interromper o fluxo a partir dos dois
// primeiros estados.
//
// "somenteStaff" marca as transições que só Admin/Barbeiro podem
// disparar (AgendamentosController já recusa o resto pra um Comum) —
// Cancelar fica de fora dessa marcação de propósito: é a única transição
// que o próprio Comum também pode fazer (desistir do horário marcado).
const TRANSICOES = {
  Agendado: [
    { rotulo: 'Confirmar', Fnacao: 'Fnconfirmar', variant: 'primary', somenteStaff: true },
    { rotulo: 'Não compareceu', Fnacao: 'FnmarcarNaoCompareceu', variant: 'ghost', somenteStaff: true },
    { rotulo: 'Cancelar', Fnacao: 'Fncancelar', variant: 'ghost' },
  ],
  Confirmado: [
    { rotulo: 'Iniciar atendimento', Fnacao: 'FniniciarAtendimento', variant: 'primary', somenteStaff: true },
    { rotulo: 'Não compareceu', Fnacao: 'FnmarcarNaoCompareceu', variant: 'ghost', somenteStaff: true },
    { rotulo: 'Cancelar', Fnacao: 'Fncancelar', variant: 'ghost' },
  ],
  EmAtendimento: [{ rotulo: 'Concluir', Fnacao: 'Fnconcluir', variant: 'primary', somenteStaff: true }],
  Concluido: [],
  Cancelado: [],
  NaoCompareceu: [],
}

// BUG corrigido aqui: 'data' é uma string "AAAA-MM-DD" (vem do <input
// type="date">) — "new Date('AAAA-MM-DD')" (sem hora) é interpretado pelo
// JS como MEIA-NOITE EM UTC, não no fuso local. Num fuso atrás de UTC
// (Brasil, sempre UTC-3), "new Date(data).setHours(0,0,0,0)" então
// recuava pro dia LOCAL anterior antes de zerar as horas — o período
// [de, ate) mandado pra Api saía um dia inteiro adiantado, fazendo um
// agendamento pedido pro dia 17 só aparecer na FnAgenda quando o barbeiro
// selecionava o dia 18. A correção é igual à já usada em
// MeusAgendamentos.jsx (ver comentário lá): construir com "T00:00:00"
// força o JS a interpretar como hora LOCAL desde o início.
function FninicioDoDia(data) {
  return new Date(`${data}T00:00:00`)
}

function FnfimDoDia(data) {
  const d = FninicioDoDia(data)
  d.setDate(d.getDate() + 1)
  return d
}

// "Hoje" como "AAAA-MM-DD" no fuso LOCAL — mesmo cuidado de sempre (ver
// comentário grande acima): NÃO usar toISOString().slice(0,10) aqui,
// senão a página de "hoje" no fuso do Brasil poderia trocar de dia horas
// antes da meia-noite de verdade. Só usada pra decidir se mostra a
// posição na fila (só faz sentido pro dia de hoje, nunca pra um dia
// passado/futuro escolhido no seletor).
function FnhojeISO() {
  const hoje = new Date()
  const yyyy = hoje.getFullYear()
  const mm = String(hoje.getMonth() + 1).padStart(2, '0')
  const dd = String(hoje.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function FnAgenda() {
  const { ehStaff } = useAuth()
  const { dados: barbeiros } = useAsync(() => barbeirosApi.Fnlistar(), [])
  // Comum não acessa mais /api/clientes (ClientesController agora é
  // Admin/Barbeiro só) — sem essa guarda a chamada voltaria 403. Como
  // consequência, o seletor de cliente do modal "Novo agendamento" fica
  // vazio pra um usuário Comum.
  const { dados: clientes } = useAsync(
    () => (ehStaff ? clientesApi.Fnlistar() : Promise.resolve([])),
    [ehStaff],
  )
  const { dados: servicos } = useAsync(() => servicosApi.Fnlistar(), [])

  const [barbeiroId, setBarbeiroId] = useState('')
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))

  const {
    dados: agendamentos,
    carregando,
    erro,
    Fnrecarregar,
  } = useAsync(
    () =>
      barbeiroId
        ? agendamentosApi.FnlistarPorBarbeiroEPeriodo(barbeiroId, FninicioDoDia(data), FnfimDoDia(data))
        : Promise.resolve([]),
    [barbeiroId, data],
  )

  const agendamentosOrdenados = useMemo(
    () => (agendamentos ?? []).slice().sort((a, b) => new Date(a.inicio) - new Date(b.inicio)),
    [agendamentos],
  )

  // "Fila de hoje" pro barbeiro ver de cara quem vem em seguida — mesmo
  // cálculo que o cliente vê em "Meus agendamentos" (ver
  // AgendamentoService.ListarMinhaFilaAsync), só que aqui é tudo local:
  // como esta tela já carrega TODOS os agendamentos daquele barbeiro
  // naquele dia (staff-only, ver ListarPorBarbeiroEPeriodo), não precisa
  // de outra chamada à Api, só numerar quem ainda não foi atendido
  // (Confirmado) ou está sendo atendido agora (EmAtendimento), na ordem
  // dos horários. Só exibida no dia de HOJE — não faz sentido "fila" pra
  // um dia passado ou futuro.
  const mostrarPosicaoFila = data === FnhojeISO()
  const posicaoFilaPorId = useMemo(() => {
    const mapa = new Map()
    let posicao = 0
    for (const ag of agendamentosOrdenados) {
      if (ag.status === 'Confirmado' || ag.status === 'EmAtendimento') {
        posicao += 1
        mapa.set(ag.id, posicao)
      }
    }
    return mapa
  }, [agendamentosOrdenados])

  const [modalNovoAberto, setModalNovoAberto] = useState(false)
  const { erro: erroAcao, FnmostrarErro, FnfecharErro } = useToastErro()

  function FnnomeCliente(id) {
    return clientes?.find((c) => c.id === id)?.nomeCompleto ?? `Cliente #${id}`
  }
  function FnnomeServico(id) {
    return servicos?.find((s) => s.id === id)?.nome ?? `Serviço #${id}`
  }

  async function FnaplicarTransicao(agendamento, Fnacao) {
    try {
      await agendamentosApi[Fnacao](agendamento.id)
      Fnrecarregar()
    } catch (err) {
      FnmostrarErro(err.message)
    }
  }

  function FnmudarDia(deltaDias) {
    const d = new Date(data)
    d.setDate(d.getDate() + deltaDias)
    setData(d.toISOString().slice(0, 10))
  }

  return (
    <div>
      <FnPageHeader
        titulo="Agenda"
        descricao="Agendamentos de um barbeiro, dia a dia."
        Fnacao={
          <FnButton disabled={!barbeiroId} onClick={() => setModalNovoAberto(true)}>
            + Novo agendamento
          </FnButton>
        }
      />

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="w-64">
          <FnField label="Barbeiro">
            <FnSelect value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)}>
              <option value="">Selecione um barbeiro...</option>
              {(barbeiros ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nomeCompleto} {b.telefone && `· ${b.telefone}`}
                </option>
              ))}
            </FnSelect>
          </FnField>
        </div>

        <div className="flex items-end gap-2">
          <FnButton variant="secondary" onClick={() => FnmudarDia(-1)}>
            <FnIconChevronEsquerda className="h-4 w-4" />
            Dia anterior
          </FnButton>
          <FnField label="Data">
            <FnInput type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </FnField>
          <FnButton variant="secondary" onClick={() => FnmudarDia(1)}>
            Próximo dia
            <FnIconChevronDireita className="h-4 w-4" />
          </FnButton>
        </div>
      </div>

      {!barbeiroId && <FnEmptyState>Escolha um barbeiro para ver a agenda do dia.</FnEmptyState>}

      {barbeiroId && carregando && <FnSpinner />}
      {barbeiroId && <FnErrorAlert erro={erro} />}

      {barbeiroId && agendamentosOrdenados.length === 0 && !carregando && (
        <FnEmptyState>Nenhum agendamento neste dia para este barbeiro.</FnEmptyState>
      )}

      {agendamentosOrdenados.length > 0 && (
        <div className="space-y-3">
          {agendamentosOrdenados.map((ag) => (
            <div
              key={ag.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-sm font-semibold text-brand-900">
                    {formatoHora.format(new Date(ag.inicio))}
                  </div>
                  <div className="text-xs text-brand-400">{formatoHora.format(new Date(ag.fim))}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {mostrarPosicaoFila && posicaoFilaPorId.has(ag.id) && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          posicaoFilaPorId.get(ag.id) === 1
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-brand-100 text-brand-700'
                        }`}
                        title="Posição na fila de hoje (calculada a partir de quem ainda não foi atendido)"
                      >
                        {posicaoFilaPorId.get(ag.id)}º da vez
                      </span>
                    )}
                    <div className="font-medium text-brand-900">{FnnomeCliente(ag.clienteId)}</div>
                  </div>
                  <div className="text-sm text-brand-500">
                    {FnnomeServico(ag.servicoId)} · {formatoMoeda.format(ag.precoCobrado)}
                  </div>
                  {ag.observacoes && <div className="text-xs text-brand-400">{ag.observacoes}</div>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FnBadge status={ag.status} />
                {TRANSICOES[ag.status]
                  ?.filter((t) => !t.somenteStaff || ehStaff)
                  .map((t) => (
                    <FnButton key={t.Fnacao} variant={t.variant} onClick={() => FnaplicarTransicao(ag, t.Fnacao)}>
                      {t.rotulo}
                    </FnButton>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <FnNovoAgendamentoModal
        aberto={modalNovoAberto}
        onFechar={() => setModalNovoAberto(false)}
        barbeiroId={barbeiroId}
        data={data}
        clientes={clientes ?? []}
        servicos={servicos ?? []}
        onCriado={() => {
          setModalNovoAberto(false)
          Fnrecarregar()
        }}
      />

      <FnToast aberto={!!erroAcao} mensagem={erroAcao ?? ''} tipo="erro" onFechar={FnfecharErro} />
    </div>
  )
}

function FnNovoAgendamentoModal({ aberto, onFechar, barbeiroId, data, clientes, servicos, onCriado }) {
  const [form, setForm] = useState({ clienteId: '', servicoId: '', hora: '09:00', observacoes: '' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  async function Fnsalvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)

    try {
      // Combina a data escolhida na agenda com a hora escolhida no
      // formulário, interpretando como horário LOCAL do navegador —
      // depois convertida pra ISO 8601 (UTC), que é o formato que o
      // DateTimeOffset do C# entende (ver CriarAgendamentoRequest.FnInicio).
      const inicio = new Date(`${data}T${form.hora}:00`)

      await agendamentosApi.Fncriar({
        clienteId: Number(form.clienteId),
        barbeiroId: Number(barbeiroId),
        servicoId: Number(form.servicoId),
        inicio: inicio.toISOString(),
        assinaturaId: null,
        observacoes: form.observacoes || null,
      })
      setForm({ clienteId: '', servicoId: '', hora: '09:00', observacoes: '' })
      onCriado()
    } catch (err) {
      // É aqui que aparece o 409 "Este barbeiro já tem um agendamento
      // nesse horário" quando o horário escolhido já está ocupado.
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <FnModal titulo="Novo agendamento" aberto={aberto} onFechar={onFechar}>
      <form onSubmit={Fnsalvar} className="space-y-4">
        <FnField label="Cliente">
          <FnSelect
            required
            value={form.clienteId}
            onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
          >
            <option value="">Selecione...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nomeCompleto}
              </option>
            ))}
          </FnSelect>
        </FnField>

        <FnField label="Serviço" hint="A duração e o preço são calculados automaticamente a partir do serviço escolhido.">
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
            <FnInput type="date" value={data} disabled />
          </FnField>
          <FnField label="Hora">
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
          />
        </FnField>

        <FnErrorAlert erro={erro ? { message: erro } : null} />

        <div className="flex justify-end gap-2 pt-2">
          <FnButton type="button" variant="secondary" onClick={onFechar}>
            Cancelar
          </FnButton>
          <FnButton type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Agendar'}
          </FnButton>
        </div>
      </form>
    </FnModal>
  )
}
