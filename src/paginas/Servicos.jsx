import { useMemo, useState } from 'react'
import { servicosApi } from '../api/servicos'
import { useAuth } from '../contexto/AuthContext'
import { useAsync } from '../ganchos/useAsync'
import { useToastErro } from '../ganchos/useToastErro'
import { FnButton } from '../componentes/ui/Button'
import { FnField, FnInput, FnSelect, FnTextarea } from '../componentes/ui/Field'
import { FnBadge } from '../componentes/ui/Badge'
import { FnModal } from '../componentes/ui/Modal'
import { FnPageHeader } from '../componentes/ui/PageHeader'
import { FnEmptyState, FnErrorAlert, FnSpinner } from '../componentes/ui/Feedback'
import { FnToast } from '../componentes/ui/Toast'
import { FnIconCheck, FnIconX } from '../componentes/ui/Icons'

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// Mesma ordem em que as seções aparecem na tela — pensada pro fluxo mais
// comum de uma barbearia (corte é o serviço mais pedido, "Outro" é o
// catch-all e por isso fica sempre por último). Precisa bater exatamente
// com os nomes do enum CategoriaServico (Barbearia.Domain.Enums) — a Api
// manda/aceita esses nomes como texto (ver JsonStringEnumConverter em
// Program.cs).
const CATEGORIAS = [
  { valor: 'Corte', rotulo: 'Cortes' },
  { valor: 'Barba', rotulo: 'Barba' },
  { valor: 'ComboCorteEBarba', rotulo: 'Combo (corte + barba)' },
  { valor: 'Sobrancelha', rotulo: 'Sobrancelha' },
  { valor: 'Coloracao', rotulo: 'Coloração' },
  { valor: 'Tratamento', rotulo: 'Tratamentos' },
  { valor: 'Outro', rotulo: 'Outros' },
]

const SERVICO_VAZIO = { nome: '', descricao: '', duracaoMinutos: 30, preco: '', categoria: 'Corte' }

export function FnServicos() {
  const { ehStaff } = useAuth()
  const { dados: servicos, carregando, erro, Fnrecarregar } = useAsync(
    () => servicosApi.Fnlistar(),
    [],
  )

  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(SERVICO_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState(null)

  // Preço é editado direto na linha da tabela — não precisa de um modal
  // só para isso, já que é a única coisa que AtualizarPrecoServicoRequest
  // permite mudar num serviço existente.
  const [editandoPrecoId, setEditandoPrecoId] = useState(null)
  const [novoPreco, setNovoPreco] = useState('')
  const { erro: erroAcao, FnmostrarErro, FnfecharErro } = useToastErro()

  // Agrupa por categoria, só as que têm pelo menos 1 serviço, na ordem
  // fixa de CATEGORIAS (não a ordem em que vieram da Api) — assim a tela
  // sempre parece a mesma, em vez de as seções pularem de lugar conforme
  // o que foi cadastrado por último.
  const secoes = useMemo(() => {
    if (!servicos) return []
    return CATEGORIAS
      .map((cat) => ({ ...cat, servicos: servicos.filter((s) => s.categoria === cat.valor) }))
      .filter((secao) => secao.servicos.length > 0)
  }, [servicos])

  function FnabrirParaCriar() {
    setForm(SERVICO_VAZIO)
    setErroForm(null)
    setModalAberto(true)
  }

  async function Fnsalvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErroForm(null)

    try {
      await servicosApi.Fncriar({
        nome: form.nome,
        descricao: form.descricao || null,
        duracaoMinutos: Number(form.duracaoMinutos),
        preco: Number(form.preco),
        categoria: form.categoria,
      })
      setModalAberto(false)
      Fnrecarregar()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  function FncomecarEdicaoPreco(servico) {
    setEditandoPrecoId(servico.id)
    setNovoPreco(String(servico.preco))
  }

  async function FnconfirmarNovoPreco(servico) {
    try {
      await servicosApi.FnatualizarPreco(servico.id, Number(novoPreco))
      setEditandoPrecoId(null)
      Fnrecarregar()
    } catch (err) {
      FnmostrarErro(err.message)
    }
  }

  // Reclassificar é só trocar o valor de um <select> — sem modal, sem
  // confirmação: mesmo espírito de "ação de um clique" que já existe pra
  // Ativar/Inativar logo ao lado.
  async function FnmudarCategoria(servico, novaCategoria) {
    try {
      await servicosApi.FnatualizarCategoria(servico.id, novaCategoria)
      Fnrecarregar()
    } catch (err) {
      FnmostrarErro(err.message)
    }
  }

  async function FnmudarStatus(servico, Fnacao) {
    try {
      await servicosApi[Fnacao](servico.id)
      Fnrecarregar()
    } catch (err) {
      FnmostrarErro(err.message)
    }
  }

  return (
    <div>
      <FnPageHeader
        titulo="Serviços"
        descricao="Catálogo de serviços, organizado por categoria — usado para calcular preço e duração dos agendamentos automaticamente."
        Fnacao={ehStaff ? <FnButton onClick={FnabrirParaCriar}>+ Novo serviço</FnButton> : null}
      />

      {carregando && <FnSpinner />}
      <FnErrorAlert erro={erro} />

      {servicos && servicos.length === 0 && (
        <FnEmptyState>Nenhum serviço cadastrado ainda.</FnEmptyState>
      )}

      <div className="space-y-8">
        {secoes.map((secao) => (
          <section key={secao.valor}>
            <h2 className="mb-3 text-lg font-semibold text-brand-900">
              {secao.rotulo} <span className="ml-1 text-sm font-normal text-brand-400">({secao.servicos.length})</span>
            </h2>

            <div className="overflow-hidden rounded-xl border border-brand-200 bg-surface">
              {/* overflow-x-auto aqui dentro: numa tela estreita, a tabela rola
                  de lado em vez de cortar colunas — o wrapper de fora mantém os
                  cantos arredondados mesmo quando a tabela é mais larga que ele. */}
              <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-100 text-brand-700">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nome</th>
                    <th className="px-4 py-3 font-medium">Duração</th>
                    <th className="px-4 py-3 font-medium">Preço</th>
                    {ehStaff && <th className="px-4 py-3 font-medium">Categoria</th>}
                    <th className="px-4 py-3 font-medium">Status</th>
                    {ehStaff && <th className="px-4 py-3 font-medium">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {secao.servicos.map((servico) => (
                    <tr key={servico.id} className="transition-colors hover:bg-brand-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-brand-900">{servico.nome}</div>
                        {servico.descricao && (
                          <div className="text-xs text-brand-500">{servico.descricao}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-brand-600">{servico.duracaoMinutos} min</td>
                      <td className="px-4 py-3 text-brand-600">
                        {ehStaff && editandoPrecoId === servico.id ? (
                          <div className="flex items-center gap-1">
                            <FnInput
                              type="number"
                              step="0.01"
                              className="w-24"
                              value={novoPreco}
                              autoFocus
                              onChange={(e) => setNovoPreco(e.target.value)}
                            />
                            <FnButton variant="ghost" onClick={() => FnconfirmarNovoPreco(servico)} aria-label="Confirmar novo preço">
                              <FnIconCheck className="h-4 w-4" />
                            </FnButton>
                            <FnButton variant="ghost" onClick={() => setEditandoPrecoId(null)} aria-label="Cancelar edição">
                              <FnIconX className="h-4 w-4" />
                            </FnButton>
                          </div>
                        ) : ehStaff ? (
                          <button
                            className="underline decoration-dotted hover:text-brand-900"
                            onClick={() => FncomecarEdicaoPreco(servico)}
                            title="Clique para alterar o preço"
                          >
                            {formatoMoeda.format(servico.preco)}
                          </button>
                        ) : (
                          formatoMoeda.format(servico.preco)
                        )}
                      </td>
                      {ehStaff && (
                        <td className="px-4 py-3">
                          <FnSelect
                            className="w-auto py-1 text-xs"
                            value={servico.categoria}
                            onChange={(e) => FnmudarCategoria(servico, e.target.value)}
                          >
                            {CATEGORIAS.map((c) => (
                              <option key={c.valor} value={c.valor}>
                                {c.rotulo}
                              </option>
                            ))}
                          </FnSelect>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <FnBadge status={servico.status} />
                      </td>
                      {ehStaff && (
                        <td className="px-4 py-3">
                          {servico.status === 'Ativo' ? (
                            <FnButton variant="ghost" onClick={() => FnmudarStatus(servico, 'Fninativar')}>
                              Inativar
                            </FnButton>
                          ) : (
                            <FnButton variant="ghost" onClick={() => FnmudarStatus(servico, 'Fnativar')}>
                              Ativar
                            </FnButton>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </section>
        ))}
      </div>

      <FnModal titulo="Novo serviço" aberto={modalAberto} onFechar={() => setModalAberto(false)}>
        <form onSubmit={Fnsalvar} className="space-y-4">
          <FnField label="Nome">
            <FnInput
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </FnField>

          <FnField label="Categoria">
            <FnSelect
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            >
              {CATEGORIAS.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.rotulo}
                </option>
              ))}
            </FnSelect>
          </FnField>

          <FnField label="Descrição (opcional)">
            <FnTextarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </FnField>

          <div className="grid grid-cols-2 gap-4">
            <FnField label="Duração (minutos)">
              <FnInput
                type="number"
                required
                min={1}
                value={form.duracaoMinutos}
                onChange={(e) => setForm({ ...form, duracaoMinutos: e.target.value })}
              />
            </FnField>

            <FnField label="Preço (R$)">
              <FnInput
                type="number"
                step="0.01"
                required
                min={0}
                value={form.preco}
                onChange={(e) => setForm({ ...form, preco: e.target.value })}
              />
            </FnField>
          </div>

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

      <FnToast aberto={!!erroAcao} mensagem={erroAcao ?? ''} tipo="erro" onFechar={FnfecharErro} />
    </div>
  )
}
