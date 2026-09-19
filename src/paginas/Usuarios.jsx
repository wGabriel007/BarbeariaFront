import { useState } from 'react'
import { usuariosApi } from '../api/usuarios'
import { clientesApi } from '../api/clientes'
import { agendamentosApi } from '../api/agendamentos'
import { pagamentosApi } from '../api/pagamentos'
import { servicosApi } from '../api/servicos'
import { barbeirosApi } from '../api/barbeiros'
import { useAsync } from '../ganchos/useAsync'
import { useToastErro } from '../ganchos/useToastErro'
import { FnButton } from '../componentes/ui/Button'
import { FnCampoBusca, FnField, FnInput, FnSelect } from '../componentes/ui/Field'
import { FnBadge } from '../componentes/ui/Badge'
import { FnAvatar } from '../componentes/ui/Avatar'
import { FnModal } from '../componentes/ui/Modal'
import { FnPageHeader } from '../componentes/ui/PageHeader'
import { FnEmptyState, FnErrorAlert, FnSpinner } from '../componentes/ui/Feedback'
import { FnToast } from '../componentes/ui/Toast'
import { FnIconMoeda, FnIconTesoura } from '../componentes/ui/Icons'
import { FnrotuloTipoUsuario } from '../utilitarios/usuario'
import { FnCorresponde } from '../utilitarios/busca'

const USUARIO_VAZIO = { nomeCompleto: '', email: '', senha: '', tipo: 'Comum' }

const FORMAS_PAGAMENTO = ['Dinheiro', 'Pix', 'CartaoCredito', 'CartaoDebito']
const RESPOSTA_FORMA = {
  Dinheiro: 'Dinheiro',
  Pix: 'Pix',
  CartaoCredito: 'Cartão de crédito',
  CartaoDebito: 'Cartão de débito',
}

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const formatoDataHora = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

// FnCadastro manual de contas — hoje só serve pra Fncriar outro Admin (ex.:
// um segundo sócio) ou uma conta Comum na mão. Não dá mais pra Fncriar
// direto como "Barbeiro": esse Tipo só nasce de uma promoção (ver tela
// "Barbeiros"), nunca de um cadastro manual — é o que garante que todo
// Barbeiro passou pelo fluxo de promoção (que também desfaz um eventual
// vínculo de Cliente).
export function FnUsuarios() {
  const { dados: usuarios, carregando, erro, Fnrecarregar } = useAsync(
    () => usuariosApi.Fnlistar(),
    [],
  )

  // Só pra traduzir servicoId/barbeiroId em nome no histórico de cortes do
  // "cartão do cliente" — mesmo truque de Agenda.jsx/MeusAgendamentos.jsx
  // (uma lista pequena, carregada uma vez, em vez de o back mandar o nome
  // já resolvido em cada agendamento).
  const { dados: servicos } = useAsync(() => servicosApi.Fnlistar(), [])
  const { dados: barbeiros } = useAsync(() => barbeirosApi.Fnlistar(), [])

  function FnnomeServico(id) {
    return servicos?.find((s) => s.id === id)?.nome ?? `Serviço #${id}`
  }
  function FnnomeBarbeiro(id) {
    return barbeiros?.find((b) => b.id === id)?.nomeCompleto ?? `Barbeiro #${id}`
  }

  // Filtro por nome/e-mail, só no que já está carregado — ver
  // utilitarios/busca.js.
  const [busca, setBusca] = useState('')
  const usuariosFiltrados = (usuarios ?? []).filter(
    (u) => FnCorresponde(u.nomeCompleto, busca) || FnCorresponde(u.email, busca),
  )

  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(USUARIO_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState(null)

  // "Cartão do cliente" — aberto a partir da linha de um usuário com tag
  // Cliente (ver FnrotuloTipoUsuario). Guardamos o usuário clicado à parte
  // do detalhe vindo da Api (usuarioSelecionado) porque ele já tem
  // nome/foto na hora, sem esperar a resposta, e detalheCliente muda de
  // formato (ClienteDetalheResponse) por linha, então não dá pra reusar
  // o useAsync de cima (que é fixo pra lista inteira).
  const [clienteAberto, setClienteAberto] = useState(false)
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null)
  const [detalheCliente, setDetalheCliente] = useState(null)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  const [erroDetalhe, setErroDetalhe] = useState(null)

  // Histórico completo (qualquer status) de cortes e pagamentos DESTE
  // cliente — carregado à parte de detalheCliente porque só sabemos o
  // Id do Cliente depois que a primeira resposta chega (ver FnverCliente).
  const [historicoCortes, setHistoricoCortes] = useState(null)
  const [historicoPagamentos, setHistoricoPagamentos] = useState(null)
  const [formaEscolhida, setFormaEscolhida] = useState({})
  const [processandoPagamentoId, setProcessandoPagamentoId] = useState(null)
  const { erro: erroAcao, FnmostrarErro, FnfecharErro } = useToastErro()

  function FnabrirParaCriar() {
    setForm(USUARIO_VAZIO)
    setErroForm(null)
    setModalAberto(true)
  }

  async function Fnsalvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErroForm(null)

    try {
      await usuariosApi.Fncriar(form)
      setModalAberto(false)
      Fnrecarregar()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function FnverCliente(usuario) {
    setUsuarioSelecionado(usuario)
    setDetalheCliente(null)
    setHistoricoCortes(null)
    setHistoricoPagamentos(null)
    setErroDetalhe(null)
    setClienteAberto(true)
    setCarregandoDetalhe(true)

    try {
      const detalhe = await clientesApi.FnobterDetalhePorUsuario(usuario.id)
      setDetalheCliente(detalhe)

      // Só depois de saber o Id do Cliente (dentro do detalhe) dá pra
      // buscar o histórico dele — as duas rotas são "por-cliente", não
      // "por-usuario" (ver agendamentosApi/pagamentosApi).
      const [cortes, pagamentos] = await Promise.all([
        agendamentosApi.FnlistarPorCliente(detalhe.dados.id),
        pagamentosApi.FnlistarPorCliente(detalhe.dados.id),
      ])
      setHistoricoCortes(cortes)
      setHistoricoPagamentos(pagamentos)
    } catch (err) {
      setErroDetalhe(err.message)
    } finally {
      setCarregandoDetalhe(false)
    }
  }

  async function FnrecarregarPagamentos() {
    if (!detalheCliente) return
    setHistoricoPagamentos(await pagamentosApi.FnlistarPorCliente(detalheCliente.dados.id))
  }

  async function FnconfirmarPagamento(pagamento) {
    setProcessandoPagamentoId(pagamento.id)
    try {
      await pagamentosApi.Fnconfirmar(pagamento.id, formaEscolhida[pagamento.id] ?? 'Dinheiro')
      await FnrecarregarPagamentos()
    } catch (err) {
      FnmostrarErro(err.message)
    } finally {
      setProcessandoPagamentoId(null)
    }
  }

  async function FnmarcarPagamentoNaoPago(pagamento) {
    setProcessandoPagamentoId(pagamento.id)
    try {
      await pagamentosApi.Fncancelar(pagamento.id)
      await FnrecarregarPagamentos()
    } catch (err) {
      FnmostrarErro(err.message)
    } finally {
      setProcessandoPagamentoId(null)
    }
  }

  return (
    <div>
      <FnPageHeader
        titulo="Usuários"
        descricao='Login do sistema. Um barbeiro nasce de um usuário Comum promovido na tela "Barbeiros" — aqui só dá pra criar contas Admin ou Comum.'
        Fnacao={<FnButton onClick={FnabrirParaCriar}>+ Novo usuário</FnButton>}
      />

      {carregando && <FnSpinner />}
      <FnErrorAlert erro={erro} />

      {usuarios && usuarios.length > 0 && (
        <div className="mb-4 max-w-sm">
          <FnCampoBusca value={busca} onChange={setBusca} placeholder="Buscar por nome ou e-mail..." />
        </div>
      )}

      {usuarios && usuarios.length === 0 && <FnEmptyState>Nenhum usuário cadastrado ainda.</FnEmptyState>}

      {usuarios && usuarios.length > 0 && usuariosFiltrados.length === 0 && (
        <FnEmptyState>Nenhum usuário encontrado para "{busca}".</FnEmptyState>
      )}

      {usuariosFiltrados.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-brand-200 bg-surface">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-100 text-brand-700">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id} className="transition-colors hover:bg-brand-50">
                  <td className="px-4 py-3 font-medium text-brand-900">
                    <div className="flex items-center gap-3">
                      <FnAvatar nome={usuario.nomeCompleto} fotoUrl={usuario.fotoUrl} tamanho="sm" />
                      {usuario.nomeCompleto}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-brand-600">{usuario.email}</td>
                  <td className="px-4 py-3 text-brand-600">{FnrotuloTipoUsuario(usuario)}</td>
                  <td className="px-4 py-3">
                    <FnBadge status={usuario.status} />
                  </td>
                  <td className="px-4 py-3">
                    {/* Só quem já foi vinculado como Cliente (ver
                        ClienteService.PromoverAsync) tem esse "cartão" pra
                        abrir — um Comum sem vínculo nenhum, ou um
                        Admin/Barbeiro, não tem cadastro de Cliente por
                        trás pra mostrar aqui. */}
                    {usuario.ehCliente ? (
                      <FnButton variant="ghost" onClick={() => FnverCliente(usuario)}>
                        Ver cliente
                      </FnButton>
                    ) : (
                      <span className="text-brand-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <FnModal titulo="Novo usuário" aberto={modalAberto} onFechar={() => setModalAberto(false)}>
        <form onSubmit={Fnsalvar} className="space-y-4">
          <FnField label="Nome completo">
            <FnInput
              required
              value={form.nomeCompleto}
              onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
            />
          </FnField>

          <FnField label="E-mail">
            <FnInput
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </FnField>

          <FnField label="Senha" hint="Fica salva como hash (BCrypt) — nunca em texto puro.">
            <FnInput
              type="password"
              required
              minLength={6}
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
            />
          </FnField>

          <FnField label="Tipo">
            <FnSelect value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="Comum">Comum</option>
              <option value="Admin">Admin</option>
            </FnSelect>
          </FnField>

          <FnErrorAlert erro={erroForm ? { message: erroForm } : null} />

          <div className="flex justify-end gap-2 pt-2">
            <FnButton type="button" variant="secondary" onClick={() => setModalAberto(false)}>
              Cancelar
            </FnButton>
            <FnButton type="submit" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </FnButton>
          </div>
        </form>
      </FnModal>

      <FnModal titulo="Dados do cliente" aberto={clienteAberto} onFechar={() => setClienteAberto(false)} tamanho="lg">
        {carregandoDetalhe && <FnSpinner />}
        <FnErrorAlert erro={erroDetalhe ? { message: erroDetalhe } : null} />

        {detalheCliente && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <FnAvatar nome={usuarioSelecionado?.nomeCompleto} fotoUrl={usuarioSelecionado?.fotoUrl} tamanho="lg" />
              <div>
                <p className="font-medium text-brand-900">{detalheCliente.dados.nomeCompleto}</p>
                <div className="mt-1">
                  <FnBadge status={detalheCliente.dados.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-brand-400">Telefone</p>
                <p className="text-brand-900">{detalheCliente.dados.telefone ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-brand-400">E-mail</p>
                <p className="text-brand-900">{detalheCliente.dados.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-brand-400">Cliente desde</p>
                <p className="text-brand-900">{formatoData.format(new Date(detalheCliente.dados.criadoEm))}</p>
              </div>
              <div>
                <p className="text-xs text-brand-400">Último corte</p>
                <p className="text-brand-900">
                  {detalheCliente.ultimoCorte ? formatoData.format(new Date(detalheCliente.ultimoCorte)) : 'Ainda não veio'}
                </p>
              </div>
            </div>

            {detalheCliente.dados.observacoes && (
              <div>
                <p className="text-xs text-brand-400">Observações</p>
                <p className="text-sm text-brand-700">{detalheCliente.dados.observacoes}</p>
              </div>
            )}

            {/* Tudo calculado na hora a partir do histórico de agendamentos
                (ver ClienteService.ObterDetalhePorUsuarioIdAsync) — nada
                fica salvo em coluna própria, igual o FnRanking de FnClientes. */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-brand-200 p-3 text-center">
                <FnIconTesoura className="mx-auto h-5 w-5 text-brand-500" />
                <p className="mt-1 text-xl font-semibold text-brand-900">{detalheCliente.totalCortes}</p>
                <p className="text-xs text-brand-500">{detalheCliente.totalCortes === 1 ? 'corte no total' : 'cortes no total'}</p>
              </div>
              <div className="rounded-lg border border-brand-200 p-3 text-center">
                <p className="mt-1 text-xl font-semibold text-brand-900">{detalheCliente.cortesEsteMes}</p>
                <p className="text-xs text-brand-500">este mês</p>
              </div>
              <div className="rounded-lg border border-brand-200 p-3 text-center">
                <FnIconMoeda className="mx-auto h-5 w-5 text-brand-500" />
                <p className="mt-1 text-xl font-semibold text-brand-900">{formatoMoeda.format(detalheCliente.valorTotalGasto)}</p>
                <p className="text-xs text-brand-500">gasto na casa</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <section>
                <h3 className="mb-2 text-sm font-semibold text-brand-900">Histórico de cortes</h3>
                {!historicoCortes && <FnSpinner />}
                {historicoCortes && historicoCortes.length === 0 && (
                  <p className="text-sm text-brand-400">Nenhum agendamento ainda.</p>
                )}
                {historicoCortes && historicoCortes.length > 0 && (
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {historicoCortes.map((ag) => (
                      <div key={ag.id} className="rounded-lg border border-brand-200 p-2.5 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-brand-900">{formatoDataHora.format(new Date(ag.inicio))}</span>
                          <FnBadge status={ag.status} />
                        </div>
                        <div className="mt-0.5 text-xs text-brand-500">
                          {FnnomeServico(ag.servicoId)} com {FnnomeBarbeiro(ag.barbeiroId)} · {formatoMoeda.format(ag.precoCobrado)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-brand-900">Histórico de pagamentos</h3>
                {!historicoPagamentos && <FnSpinner />}
                {historicoPagamentos && historicoPagamentos.length === 0 && (
                  <p className="text-sm text-brand-400">Nenhum pagamento ainda.</p>
                )}
                {historicoPagamentos && historicoPagamentos.length > 0 && (
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {historicoPagamentos.map((pg) => (
                      <div key={pg.id} className="rounded-lg border border-brand-200 p-2.5 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-brand-900">{formatoMoeda.format(pg.valor)}</span>
                          <FnBadge status={pg.status} />
                        </div>
                        <div className="mt-0.5 text-xs text-brand-500">
                          {formatoDataHora.format(new Date(pg.criadoEm))}
                          {pg.pagoEm && ` · pago em ${formatoDataHora.format(new Date(pg.pagoEm))} (${RESPOSTA_FORMA[pg.forma]})`}
                        </div>

                        {/* Só um pagamento Pendente pode ser "gerenciado" —
                            Pago/Cancelado/Reembolsado já são definitivos
                            (mesma máquina de estados de Pagamento, ver
                            Pagamento.cs). */}
                        {pg.status === 'Pendente' && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <FnSelect
                              className="w-40"
                              value={formaEscolhida[pg.id] ?? 'Dinheiro'}
                              onChange={(e) => setFormaEscolhida({ ...formaEscolhida, [pg.id]: e.target.value })}
                            >
                              {FORMAS_PAGAMENTO.map((f) => (
                                <option key={f} value={f}>
                                  {RESPOSTA_FORMA[f]}
                                </option>
                              ))}
                            </FnSelect>
                            <FnButton
                              type="button"
                              variant="ghost"
                              disabled={processandoPagamentoId === pg.id}
                              onClick={() => FnconfirmarPagamento(pg)}
                            >
                              Confirmar
                            </FnButton>
                            <FnButton
                              type="button"
                              variant="ghost"
                              disabled={processandoPagamentoId === pg.id}
                              onClick={() => FnmarcarPagamentoNaoPago(pg)}
                            >
                              Não pago
                            </FnButton>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="flex justify-end pt-2">
              <FnButton type="button" variant="secondary" onClick={() => setClienteAberto(false)}>
                Fechar
              </FnButton>
            </div>
          </div>
        )}
      </FnModal>

      <FnToast aberto={!!erroAcao} mensagem={erroAcao ?? ''} tipo="erro" onFechar={FnfecharErro} />
    </div>
  )
}
