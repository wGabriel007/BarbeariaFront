import { useEffect, useRef, useState } from 'react'
import { configuracaoSiteApi } from '../api/configuracaoSite'
import { FnurlArquivo } from '../api/client'
import { useConfiguracaoSite } from '../contexto/ConfiguracaoSiteContext'
import { FnButton } from '../componentes/ui/Button'
import { FnField, FnInput } from '../componentes/ui/Field'
import { FnPageHeader } from '../componentes/ui/PageHeader'
import { FnErrorAlert } from '../componentes/ui/Feedback'
import { FnIconLogo } from '../componentes/ui/Icons'
import { FnToast } from '../componentes/ui/Toast'

const COR_PADRAO = '#334562' // igual ao --color-brand-700 padrão em index.css

// Tela só de Admin (ver FnRotaProtegida somenteAdmin em App.jsx) pra
// personalizar a marca do site: nome da barbearia, logo e cor de
// destaque. Escopo deliberadamente menor do que "fundo do site" —
// trocar a IMAGEM de fundo inteira brigaria com o modo claro/escuro (ver
// index.css) e recalcular uma rampa de cor inteira a partir de uma
// escolha só do Admin tende a dar contraste ruim (ver comentário em
// ConfiguracaoSiteContext.jsx). Logo + uma cor de destaque cobre o
// pedido ("personalizar") sem esses riscos.
export function FnConfiguracaoAparencia() {
  const { config, Fnrecarregar } = useConfiguracaoSite()
  const inputLogoRef = useRef(null)

  const [form, setForm] = useState({ nomeBarbearia: '', corPrimaria: COR_PADRAO })
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState(null)
  const [toastAberto, setToastAberto] = useState(false)

  const [enviandoLogo, setEnviandoLogo] = useState(false)
  const [erroLogo, setErroLogo] = useState(null)

  useEffect(() => {
    if (config) {
      setForm({ nomeBarbearia: config.nomeBarbearia, corPrimaria: config.corPrimaria ?? COR_PADRAO })
    }
  }, [config])

  async function Fnsalvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErroForm(null)
    try {
      await configuracaoSiteApi.Fnatualizar({ nomeBarbearia: form.nomeBarbearia, corPrimaria: form.corPrimaria })
      Fnrecarregar()
      setToastAberto(true)
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function FnenviarLogo(e) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return

    setEnviandoLogo(true)
    setErroLogo(null)
    try {
      await configuracaoSiteApi.FnenviarLogo(arquivo)
      Fnrecarregar()
    } catch (err) {
      setErroLogo(err.message)
    } finally {
      setEnviandoLogo(false)
    }
  }

  async function FnremoverLogo() {
    setEnviandoLogo(true)
    setErroLogo(null)
    try {
      await configuracaoSiteApi.FnremoverLogo()
      Fnrecarregar()
    } catch (err) {
      setErroLogo(err.message)
    } finally {
      setEnviandoLogo(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <FnPageHeader
        titulo="Aparência"
        descricao="Logo e cor de destaque do site — visível pra todo mundo, inclusive na tela de login."
      />

      <section className="rounded-xl border border-brand-200 bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-brand-900">Logo</h2>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-brand-300 bg-brand-50">
            {config?.logoUrl ? (
              <img src={FnurlArquivo(config.logoUrl)} alt={config.nomeBarbearia} className="h-full w-full rounded-xl object-contain p-2" />
            ) : (
              <FnIconLogo className="h-8 w-8 text-brand-400" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap gap-2">
              <FnButton type="button" variant="secondary" disabled={enviandoLogo} onClick={() => inputLogoRef.current?.click()}>
                {enviandoLogo ? 'Enviando...' : config?.logoUrl ? 'Trocar logo' : 'Enviar logo'}
              </FnButton>
              {config?.logoUrl && (
                <FnButton type="button" variant="ghost" disabled={enviandoLogo} onClick={FnremoverLogo}>
                  Remover logo
                </FnButton>
              )}
              <input
                ref={inputLogoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={FnenviarLogo}
              />
            </div>
            <p className="mt-2 text-xs text-brand-500">JPEG, PNG ou WEBP, até 3 MB.</p>
            {erroLogo && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{erroLogo}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-brand-200 bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-brand-900">Nome e cor</h2>
        <form onSubmit={Fnsalvar} className="space-y-4">
          <FnField label="Nome da barbearia" hint="Aparece na barra lateral e na tela de login.">
            <FnInput
              required
              value={form.nomeBarbearia}
              onChange={(e) => setForm({ ...form, nomeBarbearia: e.target.value })}
            />
          </FnField>

          <FnField label="Cor de destaque" hint="Usada em botões, ícones e no item ativo do menu.">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.corPrimaria}
                onChange={(e) => setForm({ ...form, corPrimaria: e.target.value })}
                className="h-10 w-14 cursor-pointer rounded-lg border border-brand-300 bg-surface p-1"
              />
              <FnInput
                value={form.corPrimaria}
                onChange={(e) => setForm({ ...form, corPrimaria: e.target.value })}
                className="max-w-[10rem]"
              />
              <FnButton type="button" variant="ghost" onClick={() => setForm({ ...form, corPrimaria: COR_PADRAO })}>
                Usar padrão
              </FnButton>
            </div>
          </FnField>

          <FnErrorAlert erro={erroForm ? { message: erroForm } : null} />

          <div className="flex justify-end">
            <FnButton type="submit" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </FnButton>
          </div>
        </form>
      </section>

      <FnToast aberto={toastAberto} onFechar={() => setToastAberto(false)} mensagem="Aparência atualizada." />
    </div>
  )
}
