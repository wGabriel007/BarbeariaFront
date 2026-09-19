import { useState } from 'react'
import { planosApi } from '../api/planos'
import { assinaturasApi } from '../api/assinaturas'
import { servicosApi } from '../api/servicos'
import { clientesApi } from '../api/clientes'
import { solicitacoesPlanoApi } from '../api/solicitacoesPlano'
import { useAuth } from '../contexto/AuthContext'
import { useAsync } from '../ganchos/useAsync'
import { useToastErro } from '../ganchos/useToastErro'
import { FnButton } from '../componentes/ui/Button'
import { FnField, FnInput, FnSelect } from '../componentes/ui/Field'
import { FnBadge } from '../componentes/ui/Badge'
import { FnModal } from '../componentes/ui/Modal'
import { FnPageHeader } from '../componentes/ui/PageHeader'
import { FnEmptyState, FnErrorAlert, FnSpinner } from '../componentes/ui/Feedback'
import { FnIconSino } from '../componentes/ui/Icons'
import { FnToast } from '../componentes/ui/Toast'

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const PLANO_VAZIO = { nome: '', descricao: '', precoMensal: '' }

// DateOnly do C# chega como "2026-09-30" (string, sem hora) — "new
// Date('2026-09-30')" é interpretado como meia-noite UTC, o que pode
// exibir o dia ANTERIOR dependendo do fuso do navegador (Brasil, por
// exemplo). Montamos a data "local" na mão em vez de deixar o construtor
// de Date interpretar a string com fuso errado (mesma solução usada em
// MeuPlano.jsx).
function FnformatarData(iso) {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.split('-').map(Number)
  return formatoData.format(new Date(ano, mes - 1, dia))
}

// Sugestão inicial de "data de vencimento" ao abrir o formulário: um mês
// depois da data de início escolhida — só um ponto de partida razoável
// pra quem está cadastrando, que pode trocar por qualquer outra data.
// Construída "na mão" (sem passar por toISOString) pelo mesmo motivo do
// FnformatarData acima — toISOString converteria pra UTC e podia voltar um
// dia num fuso atrás de UTC como o do Brasil.
function FnsomarUmMes(dataISO) {
  const [ano, mes, dia] = dataISO.split('-').map(Number)
  const d = new Date(ano, mes, dia) // mes (sem "-1") já soma 1 mês
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// "Hoje" como "AAAA-MM-DD" no fuso LOCAL — evitando o mesmo problema de
// "new Date().toISOString().slice(0, 10)", que usa o dia em UTC e pode
// mostrar AMANHÃ perto da meia-noite num fuso atrás de UTC (Brasil).
function FnhojeISO() {
  const hoje = new Date()
  const yyyy = hoje.getFullYear()
  const mm = String(hoje.getMonth() + 1).padStart(2, '0')
  const dd = String(hoje.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function FnPlanos() {
  return (
    <div className="space-y-10">
      <FnPageHeader
        titulo="Planos de assinatura"
        descricao="Um plano agrupa serviços com um limite mensal (ex.: '2 cortes por mês') por um preço fixo."
      />
      <FnSecaoPlanos />
      <FnSecaoMeusPlanos />
      <FnSecaoAssinaturas />
    </div>
  )
}

// ---------------------------------------------------------------------
// Seção 1: catálogo de planos + quais serviços cada um inclui
// ---------------------------------------------------------------------
function FnSecaoPlanos() {
  // Só Admin/Barbeiro criam plano ou incluem serviço nele — Comum só lê
  // o catálogo (PlanosAssinaturaController já recusa o resto).
  const { ehStaff, usuario } = useAuth()
  const { dados: planos, carregando, erro, Fnrecarregar } = useAsync(() => planosApi.Fnlistar(), [])
  const { dados: servicos } = useAsync(() => servicosApi.Fnlistar(), [])

  // Só um pedido de plano em aberto por vez (ver
  // SolicitacaoPlanoService.SolicitarAsync) — usado aqui só pra já
  // desabilitar o sino de pedir na hora, em vez do usuário descobrir
  // com um erro do back depois de preencher o modal inteiro.
  const { dados: meusPedidos, Fnrecarregar: recarregarMeusPedidos } = useAsync(
    () => (ehStaff ? Promise.resolve([]) : solicitacoesPlanoApi.FnlistarMeus()),
    [ehStaff],
  )
  const temPedidoPendente = (meusPedidos ?? []).some((s) => s.status === 'Pendente')

  const [modalCriarAberto, setModalCriarAberto] = useState(false)
  const [form, setForm] = useState(PLANO_VAZIO)
  const [erroForm, setErroForm] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const [planoDeServico, setPlanoDeServico] = useState(null)
  const [servicoForm, setServicoForm] = useState({ servicoId: '', limiteMensal: 1 })
  const [erroServico, setErroServico] = useState(null)

  // Comum pede o plano por aqui — email/telefone digitados na hora
  // (não os que já estão na conta) viram o contato do Cliente que é
  // criado automaticamente se o Admin/Barbeiro Fnaceitar o pedido.
  const [planoParaSolicitar, setPlanoParaSolicitar] = useState(null)
  const [solicitarForm, setSolicitarForm] = useState({ email: '', telefone: '' })
  const [erroSolicitar, setErroSolicitar] = useState(null)
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false)
  const [toastAberto, setToastAberto] = useState(false)
  const { erro: erroAcao, FnmostrarErro, FnfecharErro } = useToastErro()

  async function FnsalvarPlano(e) {
    e.preventDefault()
    setSalvando(true)
    setErroForm(null)
    try {
      await planosApi.Fncriar({
        nome: form.nome,
        descricao: form.descricao || null,
        precoMensal: Number(form.precoMensal),
      })
      setModalCriarAberto(false)
      setForm(PLANO_VAZIO)
      Fnrecarregar()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function FnsalvarServicoNoPlano(e) {
    e.preventDefault()
    setErroServico(null)
    try {
      await planosApi.FnincluirServico(planoDeServico.id, {
        servicoId: Number(servicoForm.servicoId),
        limiteMensal: Number(servicoForm.limiteMensal),
      })
      setPlanoDeServico(null)
      Fnrecarregar()
    } catch (err) {
      setErroServico(err.message)
    }
  }

  async function FnmudarStatus(plano, Fnacao) {
    try {
      await planosApi[Fnacao](plano.id)
      Fnrecarregar()
    } catch (err) {
      FnmostrarErro(err.message)
    }
  }

  async function FnenviarSolicitacao(e) {
    e.preventDefault()
    setErroSolicitar(null)
    setEnviandoSolicitacao(true)
    try {
      await solicitacoesPlanoApi.Fnsolicitar({
        planoId: planoParaSolicitar.id,
        email: solicitarForm.email,
        telefone: solicitarForm.telefone,
      })
      setPlanoParaSolicitar(null)
      recarregarMeusPedidos()
      setToastAberto(true)
    } catch (err) {
      setErroSolicitar(err.message)
    } finally {
      setEnviandoSolicitacao(false)
    }
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-900">Planos</h2>
        {ehStaff && <FnButton onClick={() => setModalCriarAberto(true)}>+ Novo plano</FnButton>}
      </div>

      {carregando && <FnSpinner />}
      <FnErrorAlert erro={erro} />

      {planos && planos.length === 0 && <FnEmptyState>Nenhum plano cadastrado ainda.</FnEmptyState>}

      {planos && planos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {planos.map((plano) => {
            // Serviço inativado não aparece mais aqui de jeito nenhum —
            // nem com uma marquinha "(inativo)" como antes: se o serviço
            // saiu do catálogo, ele some da lista do plano também (o
            // vínculo continua existindo no banco, só não é mostrado).
            const servicosVisiveis = plano.servicosInclusos.filter(
              (si) => si.statusServico !== 'Inativo',
            )

            return (
            <div
              key={plano.id}
              className="rounded-xl border border-brand-200 bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-brand-900">{plano.nome}</h3>
                  <p className="text-sm text-brand-600">{formatoMoeda.format(plano.precoMensal)}/mês</p>
                </div>
                <div className="flex items-center gap-2">
                  {!ehStaff && plano.status === 'Ativo' && (
                    <button
                      type="button"
                      title={
                        temPedidoPendente
                          ? 'Você já tem uma solicitação de plano pendente'
                          : 'Solicitar este plano'
                      }
                      disabled={temPedidoPendente}
                      onClick={() => {
                        setPlanoParaSolicitar(plano)
                        setSolicitarForm({ email: usuario?.email ?? '', telefone: '' })
                        setErroSolicitar(null)
                      }}
                      className="rounded-full p-1.5 text-brand-500 transition-colors hover:bg-brand-100 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <FnIconSino className="h-5 w-5" />
                    </button>
                  )}
                  <FnBadge status={plano.status} />
                </div>
              </div>
              {plano.descricao && <p className="mt-2 text-xs text-brand-500">{plano.descricao}</p>}

              <div className="mt-3 space-y-1">
                {servicosVisiveis.length === 0 && (
                  <p className="text-xs text-brand-400">Nenhum serviço incluído ainda.</p>
                )}
                {servicosVisiveis.map((si) => (
                  <div key={si.servicoId} className="text-xs text-brand-600">
                    • {si.nomeServico} — até {si.limiteMensal}x/mês
                  </div>
                ))}
              </div>

              {ehStaff && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <FnButton
                    variant="ghost"
                    onClick={() => {
                      setPlanoDeServico(plano)
                      setServicoForm({ servicoId: '', limiteMensal: 1 })
                      setErroServico(null)
                    }}
                  >
                    + Incluir serviço
                  </FnButton>
                  {plano.status === 'Ativo' ? (
                    <FnButton variant="ghost" onClick={() => FnmudarStatus(plano, 'Fninativar')}>
                      Inativar
                    </FnButton>
                  ) : (
                    <FnButton variant="ghost" onClick={() => FnmudarStatus(plano, 'Fnativar')}>
                      Ativar
                    </FnButton>
                  )}
                </div>
              )}
            </div>
            )
          })}
        </div>
      )}

      <FnModal titulo="Novo plano" aberto={modalCriarAberto} onFechar={() => setModalCriarAberto(false)}>
        <form onSubmit={FnsalvarPlano} className="space-y-4">
          <FnField label="Nome">
            <FnInput required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </FnField>
          <FnField label="Descrição (opcional)">
            <FnInput value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </FnField>
          <FnField label="Preço mensal (R$)">
            <FnInput
              type="number"
              step="0.01"
              min={0}
              required
              value={form.precoMensal}
              onChange={(e) => setForm({ ...form, precoMensal: e.target.value })}
            />
          </FnField>

          <FnErrorAlert erro={erroForm ? { message: erroForm } : null} />

          <div className="flex justify-end gap-2 pt-2">
            <FnButton type="button" variant="secondary" onClick={() => setModalCriarAberto(false)}>
              Cancelar
            </FnButton>
            <FnButton type="submit" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </FnButton>
          </div>
        </form>
      </FnModal>

      <FnModal
        titulo={`Incluir serviço em "${planoDeServico?.nome ?? ''}"`}
        aberto={!!planoDeServico}
        onFechar={() => setPlanoDeServico(null)}
      >
        <form onSubmit={FnsalvarServicoNoPlano} className="space-y-4">
          <FnField label="Serviço">
            <FnSelect
              required
              value={servicoForm.servicoId}
              onChange={(e) => setServicoForm({ ...servicoForm, servicoId: e.target.value })}
            >
              <option value="">Selecione...</option>
              {(servicos ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </FnSelect>
          </FnField>
          <FnField label="Limite mensal (vezes por mês)">
            <FnInput
              type="number"
              min={1}
              required
              value={servicoForm.limiteMensal}
              onChange={(e) => setServicoForm({ ...servicoForm, limiteMensal: e.target.value })}
            />
          </FnField>

          <FnErrorAlert erro={erroServico ? { message: erroServico } : null} />

          <div className="flex justify-end gap-2 pt-2">
            <FnButton type="button" variant="secondary" onClick={() => setPlanoDeServico(null)}>
              Cancelar
            </FnButton>
            <FnButton type="submit">Incluir</FnButton>
          </div>
        </form>
      </FnModal>

      <FnModal
        titulo={`Solicitar "${planoParaSolicitar?.nome ?? ''}"`}
        aberto={!!planoParaSolicitar}
        onFechar={() => setPlanoParaSolicitar(null)}
      >
        <form onSubmit={FnenviarSolicitacao} className="space-y-4">
          <p className="text-sm text-brand-600">
            Preencha seu e-mail e telefone de contato. A equipe de suporte vai analisar o pedido e, se aceito,
            você passa a ser cliente automaticamente.
          </p>
          <FnField label="E-mail">
            <FnInput
              type="email"
              required
              value={solicitarForm.email}
              onChange={(e) => setSolicitarForm({ ...solicitarForm, email: e.target.value })}
            />
          </FnField>
          <FnField label="Telefone">
            <FnInput
              required
              value={solicitarForm.telefone}
              onChange={(e) => setSolicitarForm({ ...solicitarForm, telefone: e.target.value })}
            />
          </FnField>

          <FnErrorAlert erro={erroSolicitar ? { message: erroSolicitar } : null} />

          <div className="flex justify-end gap-2 pt-2">
            <FnButton type="button" variant="secondary" onClick={() => setPlanoParaSolicitar(null)}>
              Cancelar
            </FnButton>
            <FnButton type="submit" disabled={enviandoSolicitacao}>
              {enviandoSolicitacao ? 'Enviando...' : 'Solicitar'}
            </FnButton>
          </div>
        </form>
      </FnModal>

      <FnToast
        aberto={toastAberto}
        onFechar={() => setToastAberto(false)}
        mensagem="Plano solicitado — aguarde a resposta da equipe de suporte."
      />
      <FnToast aberto={!!erroAcao} mensagem={erroAcao ?? ''} tipo="erro" onFechar={FnfecharErro} />
    </section>
  )
}

// ---------------------------------------------------------------------
// Seção 1.5: "Meus planos" — Comum acompanha aqui o status dos pedidos
// que fez (Pendente/Aceita/Rejeitada), igual à ideia de "Meus
// agendamentos". Staff não pede plano pra si mesmo, então esta seção
// fica escondida pra Admin/Barbeiro.
// ---------------------------------------------------------------------
function FnSecaoMeusPlanos() {
  const { ehStaff } = useAuth()
  const { dados: solicitacoes, carregando, erro } = useAsync(
    () => (ehStaff ? Promise.resolve([]) : solicitacoesPlanoApi.FnlistarMeus()),
    [ehStaff],
  )

  if (ehStaff) return null

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-brand-900">Meus planos</h2>

      {carregando && <FnSpinner />}
      <FnErrorAlert erro={erro} />

      {solicitacoes && solicitacoes.length === 0 && (
        <FnEmptyState>Você ainda não solicitou nenhum plano.</FnEmptyState>
      )}

      {solicitacoes && solicitacoes.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-brand-200 bg-surface">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-100 text-brand-700">
              <tr>
                <th className="px-4 py-3 font-medium">Plano</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Resposta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {solicitacoes.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-brand-50">
                  <td className="px-4 py-3 font-medium text-brand-900">{s.nomePlano}</td>
                  <td className="px-4 py-3">
                    <FnBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-brand-600">{s.mensagemResposta ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------
// Seção 2: assinaturas de um cliente específico
//
// A Api não tem "listar todas as assinaturas" — só "por cliente" (ver
// AssinaturasController). Por isso esta seção pede pra escolher um
// cliente primeiro, e só então mostra/gerencia as assinaturas dele.
// ---------------------------------------------------------------------
function FnSecaoAssinaturas() {
  // Idem: só Admin/Barbeiro criam/suspendem/cancelam/reativam assinatura
  // (AssinaturasController já recusa o resto) — Comum não cria a própria.
  const { ehStaff } = useAuth()
  // Comum não acessa mais /api/clientes — e como esta seção inteira
  // depende de escolher um cliente na lista, ela é escondida pra Comum
  // (ver o retorno antecipado abaixo) em vez de mostrar um seletor vazio.
  const { dados: clientes } = useAsync(
    () => (ehStaff ? clientesApi.Fnlistar() : Promise.resolve([])),
    [ehStaff],
  )
  const { dados: planos } = useAsync(() => planosApi.Fnlistar(), [])

  const [clienteId, setClienteId] = useState('')
  const {
    dados: assinaturas,
    carregando,
    erro,
    Fnrecarregar,
  } = useAsync(() => (clienteId ? assinaturasApi.FnlistarPorCliente(clienteId) : Promise.resolve([])), [
    clienteId,
  ])

  const [modalNovaAberto, setModalNovaAberto] = useState(false)
  const [form, setForm] = useState({ planoId: '', dataInicio: '', dataVencimento: '' })
  const [erroForm, setErroForm] = useState(null)
  const { erro: erroAcao, FnmostrarErro, FnfecharErro } = useToastErro()

  function FnnomePlano(planoId) {
    return planos?.find((p) => p.id === planoId)?.nome ?? `Plano #${planoId}`
  }

  async function FnsalvarAssinatura(e) {
    e.preventDefault()
    setErroForm(null)
    try {
      await assinaturasApi.Fncriar({
        clienteId: Number(clienteId),
        planoId: Number(form.planoId),
        dataInicio: form.dataInicio,
        dataVencimento: form.dataVencimento,
      })
      setModalNovaAberto(false)
      Fnrecarregar()
    } catch (err) {
      setErroForm(err.message)
    }
  }

  async function Fnacao(assinatura, tipo) {
    try {
      if (tipo === 'cancelar') {
        const hoje = new Date().toISOString().slice(0, 10)
        await assinaturasApi.Fncancelar(assinatura.id, hoje)
      } else {
        await assinaturasApi[tipo](assinatura.id)
      }
      Fnrecarregar()
    } catch (err) {
      FnmostrarErro(err.message)
    }
  }

  // Esta seção inteira depende da lista de clientes (pra escolher de
  // quem ver/gerenciar assinaturas), e Comum não tem mais acesso a ela —
  // então, pra Comum, a seção fica escondida em vez de aparecer com um
  // seletor de cliente sempre vazio.
  if (!ehStaff) return null

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-brand-900">Assinaturas por cliente</h2>

      <div className="mb-4 max-w-sm">
        <FnField label="Cliente">
          <FnSelect value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Selecione um cliente...</option>
            {(clientes ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nomeCompleto}
              </option>
            ))}
          </FnSelect>
        </FnField>
      </div>

      {!clienteId && <FnEmptyState>Escolha um cliente para ver ou criar assinaturas.</FnEmptyState>}

      {clienteId && (
        <>
          {ehStaff && (
            <div className="mb-3">
              <FnButton
                onClick={() => {
                  const dataInicio = FnhojeISO()
                  setForm({ planoId: '', dataInicio, dataVencimento: FnsomarUmMes(dataInicio) })
                  setErroForm(null)
                  setModalNovaAberto(true)
                }}
              >
                + Nova assinatura
              </FnButton>
            </div>
          )}

          {carregando && <FnSpinner />}
          <FnErrorAlert erro={erro} />

          {assinaturas && assinaturas.length === 0 && (
            <FnEmptyState>Este cliente ainda não tem nenhuma assinatura.</FnEmptyState>
          )}

          {assinaturas && assinaturas.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-brand-200 bg-surface">
              <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-100 text-brand-700">
                  <tr>
                    <th className="px-4 py-3 font-medium">Plano</th>
                    <th className="px-4 py-3 font-medium">Início</th>
                    <th className="px-4 py-3 font-medium">Vencimento</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    {ehStaff && <th className="px-4 py-3 font-medium">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {assinaturas.map((a) => (
                    <tr key={a.id} className="transition-colors hover:bg-brand-50">
                      <td className="px-4 py-3 font-medium text-brand-900">{FnnomePlano(a.planoId)}</td>
                      <td className="px-4 py-3 text-brand-600">{FnformatarData(a.dataInicio)}</td>
                      <td className="px-4 py-3 text-brand-600">{FnformatarData(a.dataVencimento)}</td>
                      <td className="px-4 py-3">
                        <FnBadge status={a.status} />
                      </td>
                      {ehStaff && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {a.status === 'Ativa' && (
                              <>
                                <FnButton variant="ghost" onClick={() => Fnacao(a, 'Fnsuspender')}>
                                  Suspender
                                </FnButton>
                                <FnButton variant="ghost" onClick={() => Fnacao(a, 'cancelar')}>
                                  Cancelar
                                </FnButton>
                              </>
                            )}
                            {a.status === 'Suspensa' && (
                              <FnButton variant="ghost" onClick={() => Fnacao(a, 'Fnreativar')}>
                                Reativar
                              </FnButton>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </>
      )}

      <FnModal titulo="Nova assinatura" aberto={modalNovaAberto} onFechar={() => setModalNovaAberto(false)}>
        <form onSubmit={FnsalvarAssinatura} className="space-y-4">
          <FnField label="Plano">
            <FnSelect
              required
              value={form.planoId}
              onChange={(e) => setForm({ ...form, planoId: e.target.value })}
            >
              <option value="">Selecione...</option>
              {(planos ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {formatoMoeda.format(p.precoMensal)}/mês
                </option>
              ))}
            </FnSelect>
          </FnField>
          <FnField label="Data de início">
            <FnInput
              type="date"
              required
              value={form.dataInicio}
              onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
            />
          </FnField>
          <FnField label="Data de vencimento" hint="A data certa do próximo pagamento — não precisa mais ser só 'o dia 5', por exemplo.">
            <FnInput
              type="date"
              required
              value={form.dataVencimento}
              onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })}
            />
          </FnField>

          <FnErrorAlert erro={erroForm ? { message: erroForm } : null} />

          <div className="flex justify-end gap-2 pt-2">
            <FnButton type="button" variant="secondary" onClick={() => setModalNovaAberto(false)}>
              Cancelar
            </FnButton>
            <FnButton type="submit">Salvar</FnButton>
          </div>
        </form>
      </FnModal>

      <FnToast aberto={!!erroAcao} mensagem={erroAcao ?? ''} tipo="erro" onFechar={FnfecharErro} />
    </section>
  )
}
