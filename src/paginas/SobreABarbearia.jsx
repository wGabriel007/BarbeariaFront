import { useEffect, useRef, useState } from 'react'
import { configuracaoSiteApi } from '../api/configuracaoSite'
import { barbeirosApi } from '../api/barbeiros'
import { FnurlArquivo } from '../api/client'
import { useAuth } from '../contexto/AuthContext'
import { useConfiguracaoSite } from '../contexto/ConfiguracaoSiteContext'
import { useAsync } from '../ganchos/useAsync'
import { FnButton } from '../componentes/ui/Button'
import { FnField, FnInput, FnTextarea } from '../componentes/ui/Field'
import { FnPageHeader } from '../componentes/ui/PageHeader'
import { FnErrorAlert } from '../componentes/ui/Feedback'
import { FnAvatar } from '../componentes/ui/Avatar'
import { FnBadge } from '../componentes/ui/Badge'
import { FnModal } from '../componentes/ui/Modal'
import { FnIconFoto, FnIconLocalizacao, FnIconLogo, FnIconX } from '../componentes/ui/Icons'
import { FnToast } from '../componentes/ui/Toast'

const INFO_VAZIA = { descricao: '', endereco: '', telefone: '', instagram: '', horarioFuncionamento: '' }
const PERFIL_VAZIO = { bio: '', especialidade: '' }

// Aba "Sobre a barbearia" — aberta pra TODO MUNDO (Comum/Cliente inclusive,
// ver App.jsx/Layout.jsx: sem "somenteStaff"), só que em modo de
// visualização pra quem não é staff — só Admin/Barbeiro editam (a Api já
// recusa a alteração pra um Comum, ver [Authorize(Roles = "Admin,Barbeiro")]
// em ConfiguracaoSiteController/BarbeirosController; aqui é só não
// mostrar formulário nem botão pra quem não pode usar). Junta três
// coisas que o Gabriel pediu juntas: local + informações da barbearia
// (uma linha só, ver ConfiguracaoSite), galeria de fotos do espaço, e o
// perfil profissional (self-service) de quem estiver logado como
// barbeiro.
export function FnSobreABarbearia() {
  const { usuario, ehStaff } = useAuth()
  const { config, Fnrecarregar } = useConfiguracaoSite()

  // Antes só achava o PRÓPRIO cadastro de barbeiro pra decidir se mostrava
  // "Seu perfil profissional" (self-only). Agora a seção virou "Nossa
  // equipe" — a lista INTEIRA de barbeiros, visível pra todo mundo (ver
  // FnEquipeDeBarbeiros abaixo), então já usamos 'barbeiros' direto, sem
  // filtrar por usuário aqui.
  const { dados: barbeiros, Fnrecarregar: FnrecarregarBarbeiros } = useAsync(() => barbeirosApi.Fnlistar(), [])

  const fotos = config?.fotos ?? []
  // Staff sempre vê a seção de fotos (é onde adiciona a primeira) — quem
  // só visualiza não tem motivo pra ver uma seção vazia com nada pra
  // fazer nela, então ela some sozinha.
  const mostrarGaleria = ehStaff || fotos.length > 0

  return (
    <div className="max-w-5xl space-y-8">
      <FnPageHeader
        titulo="Sobre a barbearia"
        descricao={
          ehStaff
            ? 'Local, contato, fotos do espaço e o perfil de quem atende — a cara profissional que o cliente vê.'
            : 'Local, contato e fotos da barbearia.'
        }
      />

      <FnCapa config={config} />

      <div className={`grid gap-8 ${mostrarGaleria ? 'lg:grid-cols-2' : ''}`}>
        <FnLocalizacaoEInformacoes config={config} Fnrecarregar={Fnrecarregar} ehStaff={ehStaff} />
        {mostrarGaleria && (
          <FnGaleriaDeFotos fotos={fotos} Fnrecarregar={Fnrecarregar} ehStaff={ehStaff} />
        )}
      </div>

      <FnEquipeDeBarbeiros barbeiros={barbeiros ?? []} usuario={usuario} Fnrecarregar={FnrecarregarBarbeiros} />
    </div>
  )
}

// "Cartão de visita" no topo — resume, de um jeito bonito, o que já foi
// configurado nas seções abaixo (todas em modo de edição, sem preview
// nenhum). Existe só pra dar aquela sensação de "produto pronto" em vez
// de uma tela cheia de formulário — some sozinho o que ainda não foi
// preenchido (endereço/telefone/Instagram), sem deixar buracos vazios.
function FnCapa({ config }) {
  const chips = [
    config?.endereco && { rotulo: config.endereco, Icone: FnIconLocalizacao },
    config?.telefone && { rotulo: config.telefone, Icone: null },
    config?.instagram && { rotulo: `@${config.instagram.replace(/^@/, '')}`, Icone: null },
  ].filter(Boolean)

  return (
    <section className="animate-fade-in overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-800 text-white shadow-lg">
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
          {config?.logoUrl ? (
            <img src={FnurlArquivo(config.logoUrl)} alt={config.nomeBarbearia} className="h-full w-full rounded-2xl object-contain p-2" />
          ) : (
            <FnIconLogo className="h-8 w-8" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold">{config?.nomeBarbearia ?? 'Barbearia'}</h2>
          <p className="mt-1 max-w-2xl text-sm text-white/80">
            {config?.descricao || 'Conte pros seus clientes um pouco sobre a barbearia — preencha a descrição abaixo.'}
          </p>
          {config?.horarioFuncionamento && (
            <p className="mt-2 text-xs font-medium text-white/70">{config.horarioFuncionamento}</p>
          )}
          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip.rotulo}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/20"
                >
                  {chip.Icone && <chip.Icone className="h-3.5 w-3.5" />}
                  {chip.rotulo}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// Endereço + telefone/WhatsApp + Instagram + horário de funcionamento +
// descrição — tudo que a Api guarda numa chamada só (ver
// ConfiguracaoSiteService.FnAtualizarInformacoesAsync), então um formulário
// só, com um "Salvar" só. O mapa ao lado do campo de endereço usa o
// embed público do Google Maps (sem chave de Api nenhuma) — só aparece
// depois que o endereço JÁ FOI SALVO (usa 'config', não o que está sendo
// digitado no campo agora), pra não recarregar o iframe a cada tecla.
//
// Quem não é staff nunca vê este formulário — ver FnLocalizacaoSomenteLeitura
// abaixo, o mesmo mapa e os mesmos dados, só que sem nenhum campo editável.
function FnLocalizacaoEInformacoes({ config, Fnrecarregar, ehStaff }) {
  if (!ehStaff) return <FnLocalizacaoSomenteLeitura config={config} />

  return <FnLocalizacaoEInformacoesForm config={config} Fnrecarregar={Fnrecarregar} />
}

// Mesmas informações do formulário abaixo, só de leitura — pro
// Comum/Cliente que abre esta aba só pra saber onde fica a barbearia e
// como entrar em contato. Sem card nenhum se ainda não tiver NADA
// cadastrado (evita uma seção vazia sem eira nem beira pra quem só
// visualiza, diferente do staff, que precisa do formulário sempre visível
// pra poder preencher a primeira vez).
function FnLocalizacaoSomenteLeitura({ config }) {
  const temAlgo = config?.endereco || config?.telefone || config?.instagram || config?.horarioFuncionamento
  if (!temAlgo) return null

  return (
    <section className="rounded-xl border border-brand-200 bg-surface p-6">
      <div className="mb-4 flex items-center gap-2">
        <FnIconLocalizacao className="h-5 w-5 text-brand-500" />
        <h2 className="text-lg font-semibold text-brand-900">Localização e contato</h2>
      </div>

      {config.endereco && (
        <div className="mb-4 overflow-hidden rounded-lg border border-brand-200">
          <iframe
            title="Localização da barbearia"
            className="h-48 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=${encodeURIComponent(config.endereco)}&output=embed`}
          />
        </div>
      )}

      <dl className="space-y-2.5 text-sm">
        {config.endereco && (
          <div className="flex flex-wrap justify-between gap-3">
            <dt className="text-brand-500">Endereço</dt>
            <dd className="text-right font-medium text-brand-900">{config.endereco}</dd>
          </div>
        )}
        {config.telefone && (
          <div className="flex flex-wrap justify-between gap-3">
            <dt className="text-brand-500">Telefone / WhatsApp</dt>
            <dd className="font-medium text-brand-900">{config.telefone}</dd>
          </div>
        )}
        {config.instagram && (
          <div className="flex flex-wrap justify-between gap-3">
            <dt className="text-brand-500">Instagram</dt>
            <dd className="font-medium text-brand-900">@{config.instagram.replace(/^@/, '')}</dd>
          </div>
        )}
        {config.horarioFuncionamento && (
          <div className="flex flex-wrap justify-between gap-3">
            <dt className="text-brand-500">Horário de funcionamento</dt>
            <dd className="font-medium text-brand-900">{config.horarioFuncionamento}</dd>
          </div>
        )}
      </dl>
    </section>
  )
}

function FnLocalizacaoEInformacoesForm({ config, Fnrecarregar }) {
  const [form, setForm] = useState(INFO_VAZIA)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [toastAberto, setToastAberto] = useState(false)

  useEffect(() => {
    if (config) {
      setForm({
        descricao: config.descricao ?? '',
        endereco: config.endereco ?? '',
        telefone: config.telefone ?? '',
        instagram: config.instagram ?? '',
        horarioFuncionamento: config.horarioFuncionamento ?? '',
      })
    }
  }, [config])

  async function Fnsalvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      await configuracaoSiteApi.FnatualizarInformacoes({
        descricao: form.descricao || null,
        endereco: form.endereco || null,
        telefone: form.telefone || null,
        instagram: form.instagram || null,
        horarioFuncionamento: form.horarioFuncionamento || null,
      })
      Fnrecarregar()
      setToastAberto(true)
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="rounded-xl border border-brand-200 bg-surface p-6">
      <div className="mb-4 flex items-center gap-2">
        <FnIconLocalizacao className="h-5 w-5 text-brand-500" />
        <h2 className="text-lg font-semibold text-brand-900">Localização e informações</h2>
      </div>

      <form onSubmit={Fnsalvar} className="space-y-4">
        <FnField label="Descrição" hint="Uma ou duas frases sobre a barbearia — aparece no topo desta página.">
          <FnTextarea
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Ex.: Barbearia de bairro, cortes clássicos e modernos, ambiente familiar desde 2015."
          />
        </FnField>

        <FnField label="Endereço">
          <FnInput
            value={form.endereco}
            onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            placeholder="Rua Exemplo, 123 — Bairro, Cidade"
          />
        </FnField>

        {config?.endereco && (
          <div className="overflow-hidden rounded-lg border border-brand-200">
            <iframe
              key={config.endereco}
              title="Localização da barbearia"
              className="h-48 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(config.endereco)}&output=embed`}
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FnField label="Telefone / WhatsApp">
            <FnInput
              type="tel"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              placeholder="11999990000"
            />
          </FnField>
          <FnField label="Instagram" hint="Só o @, sem o link inteiro.">
            <FnInput
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value.replace(/^@/, '') })}
              placeholder="minhabarbearia"
            />
          </FnField>
        </div>

        <FnField label="Horário de funcionamento">
          <FnInput
            value={form.horarioFuncionamento}
            onChange={(e) => setForm({ ...form, horarioFuncionamento: e.target.value })}
            placeholder="Seg a Sáb, 09h às 19h"
          />
        </FnField>

        <FnErrorAlert erro={erro ? { message: erro } : null} />

        <div className="flex justify-end">
          <FnButton type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </FnButton>
        </div>
      </form>

      <FnToast aberto={toastAberto} onFechar={() => setToastAberto(false)} mensagem="Informações atualizadas." />
    </section>
  )
}

// Galeria de fotos do espaço — grade responsiva com botão de remover no
// hover de cada foto (sem confirmação: é uma ação de baixo risco, a
// foto continua podendo ser reenviada, igual trocar a logo em
// ConfiguracaoAparencia.jsx). O limite de 12 fotos é do próprio Domain
// (ver ConfiguracaoSite.FnAdicionarFoto) — o erro de "galeria cheia"
// chega pronto em err.message, igual qualquer outra regra de negócio.
//
// Quem não é staff só vê as fotos, sem botão de adicionar/remover nem
// contador de limite (ver FnSobreABarbearia acima, que só mostra esta
// seção pra um Comum/Cliente quando já existe pelo menos uma foto).
function FnGaleriaDeFotos({ fotos, Fnrecarregar, ehStaff }) {
  const inputFotoRef = useRef(null)
  const [enviando, setEnviando] = useState(false)
  const [removendoId, setRemovendoId] = useState(null)
  const [erro, setErro] = useState(null)

  if (!ehStaff) {
    return (
      <section className="rounded-xl border border-brand-200 bg-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <FnIconFoto className="h-5 w-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-brand-900">Fotos da barbearia</h2>
        </div>
        {/* Mesma altura do mapa da seção de Localização ao lado (h-48) —
            só 2 colunas (em vez de 3/4) pra caber uma foto grande de
            verdade, não uma miniatura, no mesmo espaço. */}
        <div className="grid grid-cols-2 gap-3">
          {fotos.map((foto) => (
            <div key={foto.id} className="h-48 overflow-hidden rounded-lg bg-brand-100">
              <img src={FnurlArquivo(foto.url)} alt="Foto da barbearia" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  async function FnenviarFoto(e) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return

    setEnviando(true)
    setErro(null)
    try {
      await configuracaoSiteApi.FnadicionarFoto(arquivo)
      Fnrecarregar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  async function FnremoverFoto(foto) {
    setRemovendoId(foto.id)
    setErro(null)
    try {
      await configuracaoSiteApi.FnremoverFoto(foto.id)
      Fnrecarregar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setRemovendoId(null)
    }
  }

  return (
    <section className="rounded-xl border border-brand-200 bg-surface p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FnIconFoto className="h-5 w-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-brand-900">Fotos da barbearia</h2>
        </div>
        <span className="text-xs text-brand-400">{fotos.length}/12</span>
      </div>

      {/* Mesma altura do mapa da seção de Localização ao lado (h-48) — só
          2 colunas (em vez de 3/4) pra caber uma foto grande de verdade,
          não uma miniatura, no mesmo espaço. */}
      <div className="grid grid-cols-2 gap-3">
        {fotos.map((foto) => (
          <div key={foto.id} className="group relative h-48 overflow-hidden rounded-lg bg-brand-100">
            <img
              src={FnurlArquivo(foto.url)}
              alt="Foto da barbearia"
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <button
              type="button"
              onClick={() => FnremoverFoto(foto)}
              disabled={removendoId === foto.id}
              className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-100"
              aria-label="Remover esta foto"
              title="Remover foto"
            >
              <FnIconX className="h-4 w-4" />
            </button>
          </div>
        ))}

        {fotos.length < 12 && (
          <button
            type="button"
            onClick={() => inputFotoRef.current?.click()}
            disabled={enviando}
            className="flex h-48 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand-300 text-brand-400 transition-colors hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
          >
            <FnIconFoto className="h-6 w-6" />
            <span className="text-xs font-medium">{enviando ? 'Enviando...' : 'Adicionar'}</span>
          </button>
        )}
      </div>

      {fotos.length === 0 && (
        <p className="mt-3 text-xs text-brand-500">Ainda sem fotos — mostre o balcão, as cadeiras, a fachada...</p>
      )}

      <input
        ref={inputFotoRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={FnenviarFoto}
      />

      <FnErrorAlert erro={erro ? { message: erro } : null} />
    </section>
  )
}

// "Nossa equipe" — substitui o antigo "Seu perfil profissional"
// (self-only, só um formulário pro próprio barbeiro): agora é uma
// vitrine com TODOS os barbeiros cadastrados, visível pra qualquer um
// (Comum/Cliente inclusive). Clicar num barbeiro abre o perfil dele —
// especialidade + bio — num modal; editar (ver Barbeiro.FnAtualizarPerfil,
// que já exige ser o próprio dono OU Admin no back) só aparece pra quem
// pode mesmo mudar aquele cadastro.
function FnEquipeDeBarbeiros({ barbeiros, usuario, Fnrecarregar }) {
  const [barbeiroAbertoId, setBarbeiroAbertoId] = useState(null)

  // Sem ninguém cadastrado ainda, não há "equipe" nenhuma pra mostrar —
  // mesmo espírito de "só aparece se há conteúdo" já usado na galeria de
  // fotos e na localização em modo leitura.
  if (barbeiros.length === 0) return null

  // Reconsulta pela lista mais atual (em vez de guardar o objeto clicado
  // à parte) — assim, depois de Fnsalvar um perfil, o modal já reflete o
  // texto novo sem precisar fechar e abrir de novo.
  const barbeiroAberto = barbeiros.find((b) => b.id === barbeiroAbertoId) ?? null
  const podeEditarAberto =
    !!barbeiroAberto && (usuario?.tipo === 'Admin' || barbeiroAberto.usuarioId === usuario?.id)

  return (
    <section className="rounded-xl border border-brand-200 bg-surface p-6">
      <h2 className="mb-1 text-lg font-semibold text-brand-900">Nossa equipe</h2>
      <p className="mb-4 text-sm text-brand-500">
        Clique em um barbeiro para conhecer a especialidade e a experiência dele.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {barbeiros.map((barbeiro) => (
          <button
            key={barbeiro.id}
            type="button"
            onClick={() => setBarbeiroAbertoId(barbeiro.id)}
            className="flex items-center gap-3 rounded-xl border border-brand-200 p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md"
          >
            <FnAvatar nome={barbeiro.nomeCompleto} fotoUrl={barbeiro.fotoUrl} tamanho="lg" />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-brand-900">{barbeiro.nomeCompleto}</div>
              <div className="mt-0.5 truncate text-xs text-brand-500">
                {barbeiro.especialidade || 'Ver perfil'}
              </div>
              {barbeiro.ausente && (
                <div className="mt-1">
                  <FnBadge status="Ausente" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <FnPerfilBarbeiroModal
        barbeiro={barbeiroAberto}
        podeEditar={podeEditarAberto}
        onFechar={() => setBarbeiroAbertoId(null)}
        Fnrecarregar={Fnrecarregar}
      />
    </section>
  )
}

// Modal de perfil de UM barbeiro — em modo leitura por padrão (o que
// qualquer cliente vê), com um botão "Editar" que troca pro mesmo
// formulário de sempre (Especialidade + Bio) só quando 'podeEditar' é
// true. É o Barbeiro.FnAtualizarPerfil de sempre (mesma regra de dono já
// usada em "Marcar ausente", Barbeiros.jsx) — só que agora quem abre o
// modal pode ser qualquer um, e só quem tem permissão vê o botão.
function FnPerfilBarbeiroModal({ barbeiro, podeEditar, onFechar, Fnrecarregar }) {
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState(PERFIL_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [toastAberto, setToastAberto] = useState(false)

  // Reseta o formulário (e sai do modo edição) sempre que um barbeiro
  // DIFERENTE é aberto — sem isso, abrir o perfil de outra pessoa logo
  // depois de editar a primeira mostraria o formulário de edição errado
  // por um instante.
  useEffect(() => {
    if (barbeiro) {
      setForm({ bio: barbeiro.bio ?? '', especialidade: barbeiro.especialidade ?? '' })
      setEditando(false)
      setErro(null)
    }
  }, [barbeiro])

  async function Fnsalvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      await barbeirosApi.FnatualizarPerfil(barbeiro.id, {
        bio: form.bio || null,
        especialidade: form.especialidade || null,
      })
      Fnrecarregar()
      setEditando(false)
      setToastAberto(true)
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <FnModal titulo={barbeiro?.nomeCompleto ?? ''} aberto={!!barbeiro} onFechar={onFechar}>
      {barbeiro && (
        <>
          {editando ? (
            <form onSubmit={Fnsalvar} className="space-y-4">
              <FnField label="Especialidade" hint="Um rótulo curto, ao lado do nome.">
                <FnInput
                  value={form.especialidade}
                  onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
                  placeholder="Ex.: Corte degradê, barba clássica"
                />
              </FnField>

              <FnField label="Sobre você" hint="Experiência, estilo de trabalho, o que você mais gosta de fazer.">
                <FnTextarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Ex.: 8 anos de experiência, especializado em cortes clássicos e navalha."
                />
              </FnField>

              <FnErrorAlert erro={erro ? { message: erro } : null} />

              <div className="flex justify-end gap-2 pt-2">
                <FnButton type="button" variant="secondary" onClick={() => setEditando(false)}>
                  Cancelar
                </FnButton>
                <FnButton type="submit" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </FnButton>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FnAvatar nome={barbeiro.nomeCompleto} fotoUrl={barbeiro.fotoUrl} tamanho="lg" />
                <div className="min-w-0">
                  {barbeiro.especialidade && (
                    <p className="text-sm font-medium text-brand-700">{barbeiro.especialidade}</p>
                  )}
                  {barbeiro.ausente && (
                    <div className="mt-1">
                      <FnBadge status="Ausente" />
                    </div>
                  )}
                </div>
              </div>

              {barbeiro.bio ? (
                <p className="whitespace-pre-wrap text-sm text-brand-700">{barbeiro.bio}</p>
              ) : (
                <p className="text-sm text-brand-400">
                  {podeEditar
                    ? 'Você ainda não escreveu uma apresentação — clique em "Editar" para contar um pouco sobre você.'
                    : 'Este barbeiro ainda não escreveu uma apresentação.'}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <FnButton type="button" variant="secondary" onClick={onFechar}>
                  Fechar
                </FnButton>
                {podeEditar && (
                  <FnButton type="button" onClick={() => setEditando(true)}>
                    Editar
                  </FnButton>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <FnToast aberto={toastAberto} onFechar={() => setToastAberto(false)} mensagem="Perfil atualizado." />
    </FnModal>
  )
}
