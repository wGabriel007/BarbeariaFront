import { useState } from 'react'
import { rankingApi } from '../api/ranking'
import { useAuth } from '../contexto/AuthContext'
import { useAsync } from '../ganchos/useAsync'
import { FnAvatar } from '../componentes/ui/Avatar'
import { FnButton } from '../componentes/ui/Button'
import { FnField, FnInput } from '../componentes/ui/Field'
import { FnModal } from '../componentes/ui/Modal'
import { FnPageHeader } from '../componentes/ui/PageHeader'
import { FnEmptyState, FnErrorAlert, FnSpinner } from '../componentes/ui/Feedback'
import { FnIconPresente, FnIconTrofeu, FnIconX } from '../componentes/ui/Icons'

const FORMATO_MES_ANO = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

function FnformatarMesAno(mes, ano) {
  const texto = FORMATO_MES_ANO.format(new Date(ano, mes - 1, 1))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Pega as posições que já têm prêmio pra pré-preencher o formulário; se
// não tiver nenhuma configurada ainda (mês novo, ninguém setou nada), abre
// já com 3 linhas em branco (1º, 2º, 3º) pra dar um ponto de partida.
function FnpremiosIniciais(posicoes) {
  const comPremio = (posicoes ?? [])
    .filter((p) => p.premio)
    .map((p) => ({ posicao: p.posicao, descricao: p.premio }))

  if (comPremio.length > 0) return comPremio
  return [1, 2, 3].map((posicao) => ({ posicao, descricao: '' }))
}

// FnRanking de FnClientes: quem mais voltou pra cortar no mês, com prêmios
// que o Admin/Barbeiro configura — e reconfigura do zero todo mês, sem
// herdar nada do mês anterior (ver comentário em RankingService no
// backend). Aberta pra qualquer usuário logado, inclusive Comum: é
// pensada pra incentivar o próprio cliente a voltar mais vezes pra
// aparecer no pódio, não é uma tela de gestão.
export function FnRanking() {
  const { ehStaff } = useAuth()
  const { dados: ranking, carregando, erro, Fnrecarregar } = useAsync(() => rankingApi.Fnobter(), [])
  const { dados: Fnhistorico, carregando: carregandoHistorico } = useAsync(() => rankingApi.Fnhistorico(12), [])

  const [modalAberto, setModalAberto] = useState(false)
  const [premios, setPremios] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState(null)

  function FnabrirConfiguracao() {
    setPremios(FnpremiosIniciais(ranking?.posicoes))
    setErroForm(null)
    setModalAberto(true)
  }

  function FnatualizarLinha(indice, campo, valor) {
    setPremios((atual) => atual.map((linha, i) => (i === indice ? { ...linha, [campo]: valor } : linha)))
  }

  function FnadicionarLinha() {
    const proximaPosicao = premios.length > 0 ? Math.max(...premios.map((p) => p.posicao)) + 1 : 1
    setPremios((atual) => [...atual, { posicao: proximaPosicao, descricao: '' }])
  }

  function FnremoverLinha(indice) {
    setPremios((atual) => atual.filter((_, i) => i !== indice))
  }

  async function FnsalvarPremios(e) {
    e.preventDefault()
    setSalvando(true)
    setErroForm(null)

    try {
      // Linha com descrição em branco = "sem prêmio nessa posição" —
      // filtrada aqui em vez de obrigar a pessoa a apagar a linha inteira.
      const premiosPreenchidos = premios
        .filter((p) => p.descricao.trim())
        .map((p) => ({ posicao: Number(p.posicao), descricao: p.descricao.trim() }))

      await rankingApi.FndefinirPremios(premiosPreenchidos)
      setModalAberto(false)
      Fnrecarregar()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <FnPageHeader
        titulo="Ranking de Clientes"
        descricao={
          ranking
            ? `Quem mais veio cortar em ${FnformatarMesAno(ranking.mes, ranking.ano).toLowerCase()}.`
            : 'Quem mais veio cortar este mês.'
        }
        Fnacao={
          ehStaff ? (
            <FnButton onClick={FnabrirConfiguracao}>
              <FnIconPresente className="h-4 w-4" />
              Configurar prêmios
            </FnButton>
          ) : null
        }
      />

      {carregando && <FnSpinner />}
      <FnErrorAlert erro={erro} />

      {ranking && ranking.posicoes.length === 0 && (
        <FnEmptyState>Nenhum cliente cortou este mês ainda.</FnEmptyState>
      )}

      {ranking && ranking.posicoes.length > 0 && (
        <div className="space-y-3">
          {ranking.posicoes.map((p) => (
            <div
              key={p.clienteId}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
                p.posicao === 1
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950'
                  : 'border-brand-200 bg-surface'
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold ${
                  p.posicao === 1
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-brand-100 text-brand-700'
                }`}
              >
                {p.posicao === 1 ? <FnIconTrofeu className="h-5 w-5" /> : p.posicao}
              </div>

              <FnAvatar nome={p.nomeCliente} fotoUrl={p.fotoUrl} />

              <div className="min-w-0 flex-1">
                <div className="font-medium text-brand-900">{p.nomeCliente}</div>
                <div className="text-xs text-brand-500">
                  {p.totalCortes} {p.totalCortes === 1 ? 'corte este mês' : 'cortes este mês'}
                </div>
              </div>

              {p.premio && (
                <div className="flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
                  <FnIconPresente className="h-3.5 w-3.5" />
                  {p.premio}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-brand-900">Campeões anteriores</h2>

        {carregandoHistorico && <FnSpinner />}

        {Fnhistorico && Fnhistorico.length === 0 && (
          <FnEmptyState>Ainda não há campeões de meses anteriores.</FnEmptyState>
        )}

        {Fnhistorico && Fnhistorico.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-brand-200 bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-100 text-brand-700">
                  <tr>
                    <th className="px-4 py-3 font-medium">Mês</th>
                    <th className="px-4 py-3 font-medium">Campeão</th>
                    <th className="px-4 py-3 font-medium">Cortes</th>
                    <th className="px-4 py-3 font-medium">Prêmio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {Fnhistorico.map((c) => (
                    <tr key={`${c.mes}-${c.ano}`} className="transition-colors hover:bg-brand-50">
                      <td className="px-4 py-3 text-brand-600">{FnformatarMesAno(c.mes, c.ano)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FnAvatar nome={c.nomeCliente} fotoUrl={c.fotoUrl} tamanho="sm" />
                          <span className="font-medium text-brand-900">{c.nomeCliente}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-brand-600">{c.totalCortes}</td>
                      <td className="px-4 py-3 text-brand-600">{c.premio ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <FnModal
        titulo="Configurar prêmios deste mês"
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
      >
        <form onSubmit={FnsalvarPremios} className="space-y-4">
          <p className="text-sm text-brand-500">
            Vale só para {ranking ? FnformatarMesAno(ranking.mes, ranking.ano).toLowerCase() : 'o mês atual'} — no
            mês que vem, os prêmios precisam ser configurados de novo.
          </p>

          <div className="space-y-3">
            {premios.map((linha, indice) => (
              <div key={indice} className="flex items-end gap-2">
                <FnField label={indice === 0 ? 'Posição' : undefined}>
                  <FnInput
                    type="number"
                    min={1}
                    className="w-20"
                    value={linha.posicao}
                    onChange={(e) => FnatualizarLinha(indice, 'posicao', e.target.value)}
                  />
                </FnField>
                <div className="flex-1">
                  <FnField label={indice === 0 ? 'Prêmio' : undefined}>
                    <FnInput
                      placeholder="Ex.: R$150 de bônus"
                      value={linha.descricao}
                      onChange={(e) => FnatualizarLinha(indice, 'descricao', e.target.value)}
                    />
                  </FnField>
                </div>
                <FnButton
                  type="button"
                  variant="ghost"
                  onClick={() => FnremoverLinha(indice)}
                  aria-label="Remover posição"
                >
                  <FnIconX className="h-4 w-4" />
                </FnButton>
              </div>
            ))}
          </div>

          <FnButton type="button" variant="secondary" onClick={FnadicionarLinha}>
            + Adicionar posição
          </FnButton>

          <FnErrorAlert erro={erroForm ? { message: erroForm } : null} />

          <div className="flex justify-end gap-2 pt-2">
            <FnButton type="button" variant="secondary" onClick={() => setModalAberto(false)}>
              Cancelar
            </FnButton>
            <FnButton type="submit" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar prêmios'}
            </FnButton>
          </div>
        </form>
      </FnModal>
    </div>
  )
}
