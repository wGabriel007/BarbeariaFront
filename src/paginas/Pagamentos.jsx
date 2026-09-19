import { useMemo, useState } from 'react'
import { pagamentosApi } from '../api/pagamentos'
import { clientesApi } from '../api/clientes'
import { useAsync } from '../ganchos/useAsync'
import { useToastErro } from '../ganchos/useToastErro'
import { FnButton } from '../componentes/ui/Button'
import { FnCampoBusca, FnField, FnSelect } from '../componentes/ui/Field'
import { FnBadge } from '../componentes/ui/Badge'
import { FnModal } from '../componentes/ui/Modal'
import { FnPageHeader } from '../componentes/ui/PageHeader'
import { FnEmptyState, FnErrorAlert, FnSpinner } from '../componentes/ui/Feedback'
import { FnToast } from '../componentes/ui/Toast'
import { FnCorresponde } from '../utilitarios/busca'

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatoDataHora = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

const FORMAS_PAGAMENTO = ['Dinheiro', 'Pix', 'CartaoCredito', 'CartaoDebito']
const RESPOSTA_FORMA = {
  Dinheiro: 'Dinheiro',
  Pix: 'Pix',
  CartaoCredito: 'Cartão de crédito',
  CartaoDebito: 'Cartão de débito',
}

function FninicioDoDia(data) {
  const d = new Date(data)
  d.setHours(0, 0, 0, 0)
  return d
}

function FnfimDoDia(data) {
  const d = FninicioDoDia(data)
  d.setDate(d.getDate() + 1)
  return d
}

// Nasce um pagamento Pendente automaticamente toda vez que um
// atendimento é concluído (ver AgendamentoService.ConcluirAsync na Api)
// — esta tela é onde o barbeiro confere, no fim do dia, quem já pagou.
// "Hoje" mostra só o dia corrente (a lista some sozinha no dia seguinte,
// já que o filtro é por data); "Histórico" deixa ver os dias anteriores.
export function FnPagamentos() {
  const [aba, setAba] = useState('hoje')

  return (
    <div>
      <FnPageHeader
        titulo="Pagamentos"
        descricao="Status de pagamento dos atendimentos concluídos — confirme ou marque como não pago."
      />

      <div className="mb-6 flex gap-1 border-b border-brand-200">
        {[
          { id: 'hoje', rotulo: 'Hoje' },
          { id: 'historico', rotulo: 'Histórico' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setAba(t.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              aba === t.id
                ? 'border-brand-700 text-brand-900'
                : 'border-transparent text-brand-500 hover:text-brand-800'
            }`}
          >
            {t.rotulo}
          </button>
        ))}
      </div>

      {aba === 'hoje' ? <FnAbaHoje /> : <FnAbaHistorico />}
    </div>
  )
}

function useClientes() {
  const { dados: clientes } = useAsync(() => clientesApi.Fnlistar(), [])
  return (id) => clientes?.find((c) => c.id === id)?.nomeCompleto ?? `Cliente #${id}`
}

function FnAbaHoje() {
  const hoje = useMemo(() => new Date(), [])
  const { dados: pagamentos, carregando, erro, Fnrecarregar } = useAsync(
    () => pagamentosApi.FnlistarPorPeriodo(FninicioDoDia(hoje), FnfimDoDia(hoje)),
    [],
  )

  return (
    <FnListaPagamentos
      pagamentos={pagamentos}
      carregando={carregando}
      erro={erro}
      Fnrecarregar={Fnrecarregar}
      vazioTexto="Nenhum pagamento gerado hoje ainda — aparece um aqui assim que um atendimento for concluído na Agenda."
    />
  )
}

function FnAbaHistorico() {
  const [dias, setDias] = useState(7)
  const periodo = useMemo(() => {
    const ate = FnfimDoDia(new Date())
    const de = FninicioDoDia(new Date())
    de.setDate(de.getDate() - (dias - 1))
    return { de, ate }
  }, [dias])

  const { dados: pagamentos, carregando, erro, Fnrecarregar } = useAsync(
    () => pagamentosApi.FnlistarPorPeriodo(periodo.de, periodo.ate),
    [periodo],
  )

  return (
    <div>
      <div className="mb-4 max-w-xs">
        <FnField label="Período">
          <FnSelect value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            <option value={7}>Últimos 7 dias</option>
            <option value={14}>Últimos 14 dias</option>
            <option value={30}>Últimos 30 dias</option>
          </FnSelect>
        </FnField>
      </div>

      <FnListaPagamentos
        pagamentos={pagamentos}
        carregando={carregando}
        erro={erro}
        Fnrecarregar={Fnrecarregar}
        vazioTexto="Nenhum pagamento registrado nesse período."
      />
    </div>
  )
}

function FnListaPagamentos({ pagamentos, carregando, erro, Fnrecarregar, vazioTexto }) {
  const FnnomeCliente = useClientes()
  const [pagamentoConfirmando, setPagamentoConfirmando] = useState(null)
  const [forma, setForma] = useState('Dinheiro')
  const [salvando, setSalvando] = useState(false)
  const [erroAcao, setErroAcao] = useState(null)
  const { erro: erroNaoPago, FnmostrarErro, FnfecharErro } = useToastErro()

  // Filtro por nome do cliente — ver utilitarios/busca.js. Roda em cima
  // da lista já ordenada, então o resultado filtrado continua na mesma
  // ordem (mais recente primeiro).
  const [busca, setBusca] = useState('')

  async function Fnconfirmar(e) {
    e.preventDefault()
    setSalvando(true)
    setErroAcao(null)
    try {
      await pagamentosApi.Fnconfirmar(pagamentoConfirmando.id, forma)
      setPagamentoConfirmando(null)
      Fnrecarregar()
    } catch (err) {
      setErroAcao(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function FnmarcarNaoPago(pagamento) {
    try {
      await pagamentosApi.Fncancelar(pagamento.id)
      Fnrecarregar()
    } catch (err) {
      FnmostrarErro(err.message)
    }
  }

  const ordenados = (pagamentos ?? []).slice().sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
  const filtrados = ordenados.filter((p) => FnCorresponde(FnnomeCliente(p.clienteId), busca))

  return (
    <div>
      {carregando && <FnSpinner />}
      <FnErrorAlert erro={erro} />

      {ordenados.length > 0 && (
        <div className="mb-4 max-w-sm">
          <FnCampoBusca value={busca} onChange={setBusca} placeholder="Buscar por nome do cliente..." />
        </div>
      )}

      {pagamentos && ordenados.length === 0 && <FnEmptyState>{vazioTexto}</FnEmptyState>}

      {ordenados.length > 0 && filtrados.length === 0 && (
        <FnEmptyState>Nenhum pagamento encontrado para "{busca}".</FnEmptyState>
      )}

      {filtrados.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-brand-200 bg-surface">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-100 text-brand-700">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Gerado em</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {filtrados.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-brand-50">
                  <td className="px-4 py-3 font-medium text-brand-900">{FnnomeCliente(p.clienteId)}</td>
                  <td className="px-4 py-3 text-brand-600">{formatoMoeda.format(p.valor)}</td>
                  <td className="px-4 py-3 text-brand-600">{formatoDataHora.format(new Date(p.criadoEm))}</td>
                  <td className="px-4 py-3">
                    <FnBadge status={p.status} />
                    {p.status === 'Pago' && (
                      <span className="ml-2 text-xs text-brand-400">{RESPOSTA_FORMA[p.forma] ?? p.forma}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'Pendente' && (
                      <div className="flex gap-2">
                        <FnButton
                          variant="ghost"
                          onClick={() => {
                            setPagamentoConfirmando(p)
                            setForma('Dinheiro')
                            setErroAcao(null)
                          }}
                        >
                          Confirmar
                        </FnButton>
                        <FnButton variant="ghost" onClick={() => FnmarcarNaoPago(p)}>
                          Não pago
                        </FnButton>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <FnModal
        titulo={`Confirmar pagamento — ${pagamentoConfirmando ? FnnomeCliente(pagamentoConfirmando.clienteId) : ''}`}
        aberto={!!pagamentoConfirmando}
        onFechar={() => setPagamentoConfirmando(null)}
      >
        <form onSubmit={Fnconfirmar} className="space-y-4">
          <FnField label="Valor">
            <p className="text-lg font-semibold text-brand-900">
              {pagamentoConfirmando && formatoMoeda.format(pagamentoConfirmando.valor)}
            </p>
          </FnField>

          <FnField label="Forma de pagamento">
            <FnSelect value={forma} onChange={(e) => setForma(e.target.value)}>
              {FORMAS_PAGAMENTO.map((f) => (
                <option key={f} value={f}>
                  {RESPOSTA_FORMA[f]}
                </option>
              ))}
            </FnSelect>
          </FnField>

          <FnErrorAlert erro={erroAcao ? { message: erroAcao } : null} />

          <div className="flex justify-end gap-2 pt-2">
            <FnButton type="button" variant="secondary" onClick={() => setPagamentoConfirmando(null)}>
              Cancelar
            </FnButton>
            <FnButton type="submit" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Confirmar pagamento'}
            </FnButton>
          </div>
        </form>
      </FnModal>

      <FnToast aberto={!!erroNaoPago} mensagem={erroNaoPago ?? ''} tipo="erro" onFechar={FnfecharErro} />
    </div>
  )
}
