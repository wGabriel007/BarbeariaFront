import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { assinaturasApi } from '../api/assinaturas'
import { planosApi } from '../api/planos'
import { solicitacoesPlanoApi } from '../api/solicitacoesPlano'
import { useAuth } from '../contexto/AuthContext'
import { useAsync } from '../ganchos/useAsync'
import { useCaminhoBarbearia } from '../ganchos/useCaminhoBarbearia'
import { FnmarcarComoVisto } from '../utilitarios/notificacoes'
import { FnButton } from '../componentes/ui/Button'
import { FnField, FnInput } from '../componentes/ui/Field'
import { FnBadge } from '../componentes/ui/Badge'
import { FnModal } from '../componentes/ui/Modal'
import { FnPageHeader } from '../componentes/ui/PageHeader'
import { FnEmptyState, FnErrorAlert, FnSpinner } from '../componentes/ui/Feedback'
import { FnIconRenovar } from '../componentes/ui/Icons'
import { FnToast } from '../componentes/ui/Toast'

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

// Entre várias assinaturas do mesmo cliente, "a atual" é a que aparece em
// destaque no topo: uma Ativa antes de qualquer coisa; sem nenhuma Ativa,
// uma Suspensa (o staff ainda pode Fnreativar); sem nenhuma das duas, a
// mais recente já encerrada — só pra não deixar a tela vazia se a pessoa
// só tiver planos antigos. É prioridade, não ordem cronológica.
const PRIORIDADE_STATUS = { Ativa: 0, Suspensa: 1, Cancelada: 2, Expirada: 2 }

// DateOnly do C# chega como "2026-09-30" (string, sem hora). new
// Date("2026-09-30") interpreta isso como meia-noite UTC, e dependendo
// do fuso do navegador (ex.: Brasil, UTC-3) isso pode exibir o dia
// ANTERIOR — por isso montamos a data "local" na mão em vez de deixar o
// construtor de Date interpretar a string direto.
function FnformatarData(iso) {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.split('-').map(Number)
  return formatoData.format(new Date(ano, mes - 1, dia))
}

// Aba "Meu Plano" — só existe pra quem logou como usuário Comum (ver
// Layout.jsx/ITENS_MENU e App.jsx). Mostra a assinatura atual em
// destaque (status, datas, serviços inclusos), permite Fncancelar o
// próprio plano na hora e pedir renovação; embaixo, um histórico de
// planos anteriores, se houver.
//
// Vale notar: "virar Cliente" ao ter um plano aceito NÃO muda o tipo de
// conta do usuário (continua "Comum" — ver Usuario.TipoUsuario) — o que
// acontece é a criação automática de um Cliente vinculado (ver
// SolicitacaoPlanoService.AceitarAsync), que é o que faz esta página
// passar a ter algo pra mostrar.
export function FnMeuPlano() {
  const { usuario } = useAuth()
  const Fncaminho = useCaminhoBarbearia()
  const { dados: assinaturas, carregando, erro, Fnrecarregar } = useAsync(() => assinaturasApi.FnlistarMinhas(), [])
  const { dados: planos } = useAsync(() => planosApi.Fnlistar(), [])

  // Mesma regra de "um pedido por vez" usada em Planos.jsx — reaproveitada
  // aqui pra desabilitar o botão de Renovar quando já existe um pedido
  // (de plano novo OU de renovação, é a mesma fila) em aberto.
  const { dados: meusPedidos, Fnrecarregar: recarregarMeusPedidos } = useAsync(
    () => solicitacoesPlanoApi.FnlistarMeus(),
    [],
  )
  const temPedidoPendente = (meusPedidos ?? []).some((s) => s.status === 'Pendente')

  // Mesma ideia de MeusAgendamentos.jsx: abrir esta tela já "consome" a
  // bolinha de notificação do menu (ver Layout.jsx) — só depende de
  // `assinaturas` (e não de `meusPedidos`) porque uma é carregada aqui
  // desde o início da tela e a outra é só um detalhe do botão Renovar;
  // esperar as duas juntas não muda nada pra quem está vendo a tela.
  useEffect(() => {
    if (!usuario || !assinaturas) return
    FnmarcarComoVisto(usuario.id, 'meu-plano')
  }, [usuario, assinaturas])

  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [erroCancelar, setErroCancelar] = useState(null)

  const [planoParaRenovar, setPlanoParaRenovar] = useState(null)
  const [renovarForm, setRenovarForm] = useState({ email: '', telefone: '' })
  const [erroRenovar, setErroRenovar] = useState(null)
  const [enviandoRenovacao, setEnviandoRenovacao] = useState(false)
  const [toastAberto, setToastAberto] = useState(false)

  const ordenadas = useMemo(
    () =>
      (assinaturas ?? [])
        .slice()
        .sort((a, b) => {
          const diferencaPrioridade = (PRIORIDADE_STATUS[a.status] ?? 3) - (PRIORIDADE_STATUS[b.status] ?? 3)
          if (diferencaPrioridade !== 0) return diferencaPrioridade
          return new Date(b.dataInicio) - new Date(a.dataInicio)
        }),
    [assinaturas],
  )
  const atual = ordenadas[0]
  const Fnhistorico = ordenadas.slice(1)

  function FnplanoDe(planoId) {
    return planos?.find((p) => p.id === planoId)
  }

  function FnabrirRenovacao(plano) {
    setPlanoParaRenovar(plano)
    setRenovarForm({ email: usuario?.email ?? '', telefone: '' })
    setErroRenovar(null)
  }

  async function FnconfirmarCancelamento() {
    setCancelando(true)
    setErroCancelar(null)
    try {
      await assinaturasApi.FncancelarMinha(atual.id)
      setConfirmandoCancelamento(false)
      Fnrecarregar()
    } catch (err) {
      setErroCancelar(err.message)
    } finally {
      setCancelando(false)
    }
  }

  async function FnenviarRenovacao(e) {
    e.preventDefault()
    setErroRenovar(null)
    setEnviandoRenovacao(true)
    try {
      await solicitacoesPlanoApi.Fnsolicitar({
        planoId: planoParaRenovar.id,
        email: renovarForm.email,
        telefone: renovarForm.telefone,
      })
      setPlanoParaRenovar(null)
      recarregarMeusPedidos()
      setToastAberto(true)
    } catch (err) {
      setErroRenovar(err.message)
    } finally {
      setEnviandoRenovacao(false)
    }
  }

  const planoAtual = atual ? FnplanoDe(atual.planoId) : null
  const podeCancelar = atual && (atual.status === 'Ativa' || atual.status === 'Suspensa')
  const servicosDoPlanoAtual = (planoAtual?.servicosInclusos ?? []).filter((si) => si.statusServico !== 'Inativo')

  return (
    <div className="space-y-8">
      <FnPageHeader titulo="Meu plano" descricao="Detalhes da sua assinatura, renovação e cancelamento." />

      {carregando && <FnSpinner />}
      <FnErrorAlert erro={erro} />

      {assinaturas && assinaturas.length === 0 && (
        <FnEmptyState>
          Você ainda não tem nenhum plano.{' '}
          <Link to={Fncaminho('/planos')} className="font-medium text-brand-700 underline hover:text-brand-900">
            Veja o catálogo de planos
          </Link>{' '}
          e solicite um.
        </FnEmptyState>
      )}

      {atual && (
        <section className="rounded-xl border border-brand-200 bg-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-brand-400">Plano atual</p>
              <h2 className="mt-1 text-xl font-semibold text-brand-900">
                {planoAtual?.nome ?? `Plano #${atual.planoId}`}
              </h2>
              {planoAtual && (
                <p className="text-sm text-brand-600">{formatoMoeda.format(planoAtual.precoMensal)}/mês</p>
              )}
            </div>
            <FnBadge status={atual.status} />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-brand-400">Início</p>
              <p className="text-sm font-medium text-brand-800">{FnformatarData(atual.dataInicio)}</p>
            </div>
            <div>
              <p className="text-xs text-brand-400">
                {atual.status === 'Ativa' || atual.status === 'Suspensa' ? 'Vencimento' : 'Encerrado em'}
              </p>
              <p className="text-sm font-medium text-brand-800">
                {atual.status === 'Ativa' || atual.status === 'Suspensa'
                  ? FnformatarData(atual.dataVencimento)
                  : FnformatarData(atual.dataFim)}
              </p>
            </div>
            {planoAtual && (
              <div>
                <p className="text-xs text-brand-400">Serviços inclusos</p>
                <p className="text-sm font-medium text-brand-800">{servicosDoPlanoAtual.length}</p>
              </div>
            )}
          </div>

          {servicosDoPlanoAtual.length > 0 && (
            <div className="mt-4 space-y-1 border-t border-brand-100 pt-4">
              {servicosDoPlanoAtual.map((si) => (
                <p key={si.servicoId} className="text-xs text-brand-600">
                  • {si.nomeServico} — até {si.limiteMensal}x/mês
                </p>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2 border-t border-brand-100 pt-5">
            {planoAtual && (
              <FnButton
                variant="secondary"
                disabled={temPedidoPendente}
                title={temPedidoPendente ? 'Você já tem uma solicitação de plano pendente' : undefined}
                onClick={() => FnabrirRenovacao(planoAtual)}
              >
                <FnIconRenovar className="h-4 w-4" />
                Renovar
              </FnButton>
            )}
            {podeCancelar && (
              <FnButton
                variant="danger"
                onClick={() => {
                  setErroCancelar(null)
                  setConfirmandoCancelamento(true)
                }}
              >
                Cancelar plano
              </FnButton>
            )}
          </div>
        </section>
      )}

      {Fnhistorico.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-brand-900">Histórico</h2>
          <div className="overflow-hidden rounded-xl border border-brand-200 bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-100 text-brand-700">
                  <tr>
                    <th className="px-4 py-3 font-medium">Plano</th>
                    <th className="px-4 py-3 font-medium">Início</th>
                    <th className="px-4 py-3 font-medium">Fim</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {Fnhistorico.map((a) => (
                    <tr key={a.id} className="transition-colors hover:bg-brand-50">
                      <td className="px-4 py-3 font-medium text-brand-900">
                        {FnplanoDe(a.planoId)?.nome ?? `Plano #${a.planoId}`}
                      </td>
                      <td className="px-4 py-3 text-brand-600">{FnformatarData(a.dataInicio)}</td>
                      <td className="px-4 py-3 text-brand-600">{FnformatarData(a.dataFim)}</td>
                      <td className="px-4 py-3">
                        <FnBadge status={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <FnModal titulo="Cancelar plano" aberto={confirmandoCancelamento} onFechar={() => setConfirmandoCancelamento(false)}>
        <p className="text-sm text-brand-600">
          Tem certeza que quer cancelar seu plano agora? Essa ação não pode ser desfeita — se mudar de ideia
          depois, será preciso solicitar o plano de novo.
        </p>

        <FnErrorAlert erro={erroCancelar ? { message: erroCancelar } : null} />

        <div className="mt-4 flex justify-end gap-2">
          <FnButton type="button" variant="secondary" onClick={() => setConfirmandoCancelamento(false)}>
            Voltar
          </FnButton>
          <FnButton type="button" variant="danger" disabled={cancelando} onClick={FnconfirmarCancelamento}>
            {cancelando ? 'Cancelando...' : 'Sim, cancelar'}
          </FnButton>
        </div>
      </FnModal>

      <FnModal titulo={`Renovar "${planoParaRenovar?.nome ?? ''}"`} aberto={!!planoParaRenovar} onFechar={() => setPlanoParaRenovar(null)}>
        <form onSubmit={FnenviarRenovacao} className="space-y-4">
          <p className="text-sm text-brand-600">
            Confirme seu e-mail e telefone de contato. A equipe de suporte vai analisar o pedido de renovação.
          </p>
          <FnField label="E-mail">
            <FnInput
              type="email"
              required
              value={renovarForm.email}
              onChange={(e) => setRenovarForm({ ...renovarForm, email: e.target.value })}
            />
          </FnField>
          <FnField label="Telefone">
            <FnInput
              required
              value={renovarForm.telefone}
              onChange={(e) => setRenovarForm({ ...renovarForm, telefone: e.target.value })}
            />
          </FnField>

          <FnErrorAlert erro={erroRenovar ? { message: erroRenovar } : null} />

          <div className="flex justify-end gap-2 pt-2">
            <FnButton type="button" variant="secondary" onClick={() => setPlanoParaRenovar(null)}>
              Cancelar
            </FnButton>
            <FnButton type="submit" disabled={enviandoRenovacao}>
              {enviandoRenovacao ? 'Enviando...' : 'Solicitar renovação'}
            </FnButton>
          </div>
        </form>
      </FnModal>

      <FnToast
        aberto={toastAberto}
        onFechar={() => setToastAberto(false)}
        mensagem="Renovação solicitada — aguarde a resposta da equipe de suporte."
      />
    </div>
  )
}
