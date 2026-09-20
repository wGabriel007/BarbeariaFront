import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { empresasApi } from '../api/empresas'
import { useAuth } from '../contexto/AuthContext'
import { useAsync } from '../ganchos/useAsync'
import { useToastErro } from '../ganchos/useToastErro'
import { FnButton } from '../componentes/ui/Button'
import { FnField, FnInput, FnPasswordInput } from '../componentes/ui/Field'
import { FnBadge } from '../componentes/ui/Badge'
import { FnModal } from '../componentes/ui/Modal'
import { FnPageHeader } from '../componentes/ui/PageHeader'
import { FnEmptyState, FnErrorAlert, FnSpinner } from '../componentes/ui/Feedback'
import { FnToast } from '../componentes/ui/Toast'
import { FnIconLogo, FnIconSair } from '../componentes/ui/Icons'

const EMPRESA_VAZIA = { nome: '', slug: '', nomeCompletoAdmin: '', emailAdmin: '', senhaAdmin: '' }

// "barbearia-do-joao Ltda" -> "barbearia-do-joao-ltda" — só uma sugestão
// inicial pro campo de slug a partir do nome digitado; a pessoa que está
// criando (o SuperAdmin) continua livre pra editar o resultado à mão
// antes de salvar (ver campo "Link da barbearia" no formulário abaixo).
function FnsugerirSlug(nome) {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Painel do SuperAdmin (dono da plataforma) — lista as barbearias
 * cadastradas, deixa Fncriar uma nova (o que já cria, junto, o primeiro
 * Admin dela — ver EmpresaService.FnCriarAsync na Api) e Fnativar/Fninativar
 * qualquer uma. Não existe "editar barbearia" aqui de propósito: nome/
 * logo/cor são coisa que cada barbearia ajusta sozinha, já logada,
 * na própria aba "Aparência" (ver paginas/ConfiguracaoAparencia.jsx).
 */
export function FnAdminDashboard() {
  const { usuario, Fnlogout } = useAuth()
  const navigate = useNavigate()
  const { dados: empresas, carregando, erro, Fnrecarregar } = useAsync(() => empresasApi.Fnlistar(), [])
  const { erro: erroAcao, FnmostrarErro, FnfecharErro } = useToastErro()

  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(EMPRESA_VAZIA)
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState(null)

  // Credenciais + link da barbearia recém-criada — fica em destaque até
  // o SuperAdmin fechar, pra dar tempo de copiar/anotar antes de sumir
  // (a senha não aparece em NENHUM outro lugar depois disso — a Api não
  // guarda senha em texto puro, só o hash — ver Usuario.cs).
  const [recemCriada, setRecemCriada] = useState(null)

  const origem = window.location.origin

  function FnabrirParaCriar() {
    setForm(EMPRESA_VAZIA)
    setSlugEditadoManualmente(false)
    setErroForm(null)
    setModalAberto(true)
  }

  function FnmudarNome(nome) {
    setForm((atual) => ({
      ...atual,
      nome,
      // Só auto-preenche o slug enquanto a pessoa não tiver mexido nele
      // na mão — senão cada letra digitada no nome apagaria um ajuste
      // manual que ela já tivesse feito no link.
      slug: slugEditadoManualmente ? atual.slug : FnsugerirSlug(nome),
    }))
  }

  async function Fnsalvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErroForm(null)

    try {
      const resultado = await empresasApi.Fncriar(form)
      setModalAberto(false)
      setRecemCriada(resultado)
      Fnrecarregar()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function FnmudarStatus(empresa, Fnacao) {
    try {
      await empresasApi[Fnacao](empresa.id)
      Fnrecarregar()
    } catch (err) {
      FnmostrarErro(err.message)
    }
  }

  async function FncopiarLink(slug) {
    const link = `${origem}/${slug}`
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // Sem permissão de clipboard (raro) — não trava a tela, só não
      // copia; o link já está visível no cartão da barbearia de qualquer
      // jeito, dá pra selecionar na mão.
    }
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <header className="flex items-center justify-between border-b border-brand-200 bg-surface px-4 py-3 sm:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white">
            <FnIconLogo className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-brand-900">Área administrativa</h1>
            <p className="text-xs text-brand-400">{usuario?.nomeCompleto}</p>
          </div>
        </div>
        <button
          onClick={Fnlogout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-100"
        >
          <FnIconSair className="h-4 w-4" />
          Sair
        </button>
      </header>

      <main className="mx-auto max-w-4xl p-4 sm:p-8">
        <FnPageHeader
          titulo="Barbearias"
          descricao="Todas as barbearias cadastradas na plataforma."
          Fnacao={<FnButton onClick={FnabrirParaCriar}>+ Nova barbearia</FnButton>}
        />

        {recemCriada && (
          <div className="mb-6 animate-slide-up rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-green-900 dark:text-green-300">
                "{recemCriada.empresa.nome}" criada — anote as credenciais abaixo
              </h2>
              <button
                onClick={() => setRecemCriada(null)}
                className="shrink-0 text-xs font-medium text-green-700 hover:underline dark:text-green-400"
              >
                Fechar
              </button>
            </div>
            <p className="mt-1 text-xs text-green-700 dark:text-green-400">
              Essa senha não aparece de novo em lugar nenhum — repasse pro dono da barbearia agora.
            </p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-green-700 dark:text-green-400">Link da barbearia</dt>
                <dd className="font-mono text-green-900 dark:text-green-200">{origem}/{recemCriada.empresa.slug}</dd>
              </div>
              <div>
                <dt className="text-xs text-green-700 dark:text-green-400">Login (e-mail)</dt>
                <dd className="font-mono text-green-900 dark:text-green-200">{recemCriada.emailAdmin}</dd>
              </div>
              <div>
                <dt className="text-xs text-green-700 dark:text-green-400">Senha</dt>
                <dd className="font-mono text-green-900 dark:text-green-200">{recemCriada.senhaAdmin}</dd>
              </div>
            </dl>
            <FnButton
              type="button"
              variant="secondary"
              className="mt-3"
              onClick={() => FncopiarLink(recemCriada.empresa.slug)}
            >
              Copiar link da barbearia
            </FnButton>
          </div>
        )}

        {carregando && <FnSpinner />}
        <FnErrorAlert erro={erro} />

        {empresas && empresas.length === 0 && (
          <FnEmptyState>Nenhuma barbearia cadastrada ainda. Clique em "+ Nova barbearia" para começar.</FnEmptyState>
        )}

        {empresas && empresas.length > 0 && (
          <div className="space-y-3">
            {empresas.map((empresa) => (
              <div
                key={empresa.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-brand-900">{empresa.nome}</span>
                    <FnBadge status={empresa.status} />
                  </div>
                  <button
                    onClick={() => FncopiarLink(empresa.slug)}
                    className="mt-0.5 truncate font-mono text-xs text-brand-500 hover:text-brand-700 hover:underline"
                    title="Copiar link"
                  >
                    {origem}/{empresa.slug}
                  </button>
                </div>
                <div className="flex shrink-0 gap-2">
                  <FnButton variant="ghost" onClick={() => navigate(`/${empresa.slug}`)}>
                    Abrir
                  </FnButton>
                  {empresa.status === 'Ativo' ? (
                    <FnButton variant="ghost" onClick={() => FnmudarStatus(empresa, 'Fninativar')}>
                      Inativar
                    </FnButton>
                  ) : (
                    <FnButton variant="ghost" onClick={() => FnmudarStatus(empresa, 'Fnativar')}>
                      Ativar
                    </FnButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <FnModal titulo="Nova barbearia" aberto={modalAberto} onFechar={() => setModalAberto(false)}>
        <form onSubmit={Fnsalvar} className="space-y-4">
          <FnField label="Nome da barbearia">
            <FnInput
              autoFocus
              required
              value={form.nome}
              onChange={(e) => FnmudarNome(e.target.value)}
            />
          </FnField>

          <FnField
            label="Link da barbearia"
            hint={`Como fica: ${origem}/${form.slug || '...'}`}
          >
            <FnInput
              required
              value={form.slug}
              onChange={(e) => {
                setSlugEditadoManualmente(true)
                setForm({ ...form, slug: e.target.value })
              }}
            />
          </FnField>

          <div className="border-t border-brand-100 pt-4">
            <p className="mb-3 text-xs font-medium text-brand-500">Conta do dono da barbearia (Admin)</p>

            <div className="space-y-4">
              <FnField label="Nome completo">
                <FnInput
                  required
                  value={form.nomeCompletoAdmin}
                  onChange={(e) => setForm({ ...form, nomeCompletoAdmin: e.target.value })}
                />
              </FnField>

              <FnField label="E-mail">
                <FnInput
                  type="email"
                  required
                  value={form.emailAdmin}
                  onChange={(e) => setForm({ ...form, emailAdmin: e.target.value })}
                />
              </FnField>

              <FnField label="Senha" hint="Mínimo de 6 caracteres — combine com o dono da barbearia.">
                <FnPasswordInput
                  required
                  minLength={6}
                  value={form.senhaAdmin}
                  onChange={(e) => setForm({ ...form, senhaAdmin: e.target.value })}
                />
              </FnField>
            </div>
          </div>

          <FnErrorAlert erro={erroForm ? { message: erroForm } : null} />

          <div className="flex justify-end gap-2 pt-2">
            <FnButton type="button" variant="secondary" onClick={() => setModalAberto(false)}>
              Cancelar
            </FnButton>
            <FnButton type="submit" disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar barbearia'}
            </FnButton>
          </div>
        </form>
      </FnModal>

      <FnToast aberto={!!erroAcao} mensagem={erroAcao ?? ''} tipo="erro" onFechar={FnfecharErro} />
    </div>
  )
}
