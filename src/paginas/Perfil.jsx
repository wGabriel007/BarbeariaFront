import { useEffect, useRef, useState } from 'react'
import { perfilApi } from '../api/perfil'
import { useAuth } from '../contexto/AuthContext'
import { useAsync } from '../ganchos/useAsync'
import { FnAvatar } from '../componentes/ui/Avatar'
import { FnButton } from '../componentes/ui/Button'
import { FnField, FnInput, FnPasswordInput } from '../componentes/ui/Field'
import { FnBadge } from '../componentes/ui/Badge'
import { FnPageHeader } from '../componentes/ui/PageHeader'
import { FnErrorAlert, FnSpinner } from '../componentes/ui/Feedback'
import { FnToast } from '../componentes/ui/Toast'
import { FnrotuloTipoUsuario } from '../utilitarios/usuario'

const SENHA_VAZIA = { senhaAtual: '', novaSenha: '', confirmarSenha: '' }

// Aba "Meu perfil" — qualquer usuário logado (Admin, Barbeiro ou Comum)
// vê e edita os PRÓPRIOS dados aqui: foto, nome/e-mail/telefone e senha.
// Diferente de Usuários (gestão de contas de terceiros, só staff), esta
// tela nunca lida com o id de outra pessoa — sempre "eu mesmo" (ver
// PerfilController na Api, que também nunca recebe um id no corpo).
export function FnPerfil() {
  const { FnatualizarUsuario } = useAuth()
  const { dados: perfil, carregando, erro, Fnrecarregar } = useAsync(() => perfilApi.Fnobter(), [])

  const [form, setForm] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState(null)
  const [toastDadosAberto, setToastDadosAberto] = useState(false)

  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [erroFoto, setErroFoto] = useState(null)
  const inputFotoRef = useRef(null)

  const [senhaForm, setSenhaForm] = useState(SENHA_VAZIA)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [erroSenha, setErroSenha] = useState(null)
  const [toastSenhaAberto, setToastSenhaAberto] = useState(false)

  // Sincroniza o form editável toda vez que 'perfil' chega/atualiza (ex.:
  // depois de Fnrecarregar() após trocar a foto) — só reseta os CAMPOS de
  // texto quando os dados de verdade mudam, nunca a cada tecla digitada.
  useEffect(() => {
    if (perfil) {
      setForm({ nomeCompleto: perfil.nomeCompleto, email: perfil.email, telefone: perfil.telefone ?? '' })
    }
  }, [perfil])

  async function FnsalvarDados(e) {
    e.preventDefault()
    setSalvando(true)
    setErroForm(null)
    try {
      const atualizado = await perfilApi.Fnatualizar({
        nomeCompleto: form.nomeCompleto,
        email: form.email,
        telefone: form.telefone || null,
      })
      // Reflete na hora na barra lateral (nome/e-mail exibidos ali) sem
      // precisar de um novo Fnlogin.
      FnatualizarUsuario({ nomeCompleto: atualizado.nomeCompleto, email: atualizado.email })
      setToastDadosAberto(true)
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function FnenviarFoto(e) {
    const arquivo = e.target.files?.[0]
    e.target.value = '' // permite escolher o mesmo arquivo de novo depois, se precisar reenviar
    if (!arquivo) return

    setEnviandoFoto(true)
    setErroFoto(null)
    try {
      const atualizado = await perfilApi.FnenviarFoto(arquivo)
      FnatualizarUsuario({ fotoUrl: atualizado.fotoUrl })
      Fnrecarregar()
    } catch (err) {
      setErroFoto(err.message)
    } finally {
      setEnviandoFoto(false)
    }
  }

  async function FnremoverFoto() {
    setEnviandoFoto(true)
    setErroFoto(null)
    try {
      await perfilApi.FnremoverFoto()
      FnatualizarUsuario({ fotoUrl: null })
      Fnrecarregar()
    } catch (err) {
      setErroFoto(err.message)
    } finally {
      setEnviandoFoto(false)
    }
  }

  async function FnsalvarSenha(e) {
    e.preventDefault()
    setErroSenha(null)

    if (senhaForm.novaSenha !== senhaForm.confirmarSenha) {
      setErroSenha('As duas senhas novas não são iguais.')
      return
    }

    setSalvandoSenha(true)
    try {
      await perfilApi.FnalterarSenha(senhaForm.senhaAtual, senhaForm.novaSenha)
      setSenhaForm(SENHA_VAZIA)
      setToastSenhaAberto(true)
    } catch (err) {
      setErroSenha(err.message)
    } finally {
      setSalvandoSenha(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <FnPageHeader titulo="Meu perfil" descricao="Seus dados de acesso — visíveis só pra você e pra equipe da barbearia." />

      {carregando && <FnSpinner />}
      <FnErrorAlert erro={erro} />

      {perfil && (
        <>
          <section className="flex flex-wrap items-center gap-5 rounded-xl border border-brand-200 bg-surface p-6">
            <FnAvatar nome={perfil.nomeCompleto} fotoUrl={perfil.fotoUrl} tamanho="lg" />
            <div className="flex-1">
              <p className="font-medium text-brand-900">{perfil.nomeCompleto}</p>
              <div className="mt-1 flex items-center gap-2">
                <FnBadge status={FnrotuloTipoUsuario(perfil)} />
                <FnBadge status={perfil.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <FnButton type="button" variant="secondary" disabled={enviandoFoto} onClick={() => inputFotoRef.current?.click()}>
                  {enviandoFoto ? 'Enviando...' : perfil.fotoUrl ? 'Trocar foto' : 'Adicionar foto'}
                </FnButton>
                {perfil.fotoUrl && (
                  <FnButton type="button" variant="ghost" disabled={enviandoFoto} onClick={FnremoverFoto}>
                    Remover foto
                  </FnButton>
                )}
                <input
                  ref={inputFotoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={FnenviarFoto}
                />
              </div>
              {erroFoto && <p className="mt-2 text-xs text-red-600">{erroFoto}</p>}
            </div>
          </section>

          {form && (
            <section className="rounded-xl border border-brand-200 bg-surface p-6">
              <h2 className="mb-4 text-lg font-semibold text-brand-900">Dados pessoais</h2>
              <form onSubmit={FnsalvarDados} className="space-y-4">
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
                <FnField label="Telefone">
                  <FnInput
                    required
                    type="tel"
                    placeholder="11999990000"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  />
                </FnField>

                <FnErrorAlert erro={erroForm ? { message: erroForm } : null} />

                <div className="flex justify-end">
                  <FnButton type="submit" disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar dados'}
                  </FnButton>
                </div>
              </form>
            </section>
          )}

          <section className="rounded-xl border border-brand-200 bg-surface p-6">
            <h2 className="mb-1 text-lg font-semibold text-brand-900">Trocar senha</h2>
            <p className="mb-4 text-sm text-brand-500">
              Pedimos a senha atual de novo — mesmo já estando logado, é a garantia de que foi você mesmo quem
              trocou.
            </p>
            <form onSubmit={FnsalvarSenha} className="space-y-4">
              <FnField label="Senha atual">
                <FnPasswordInput
                  required
                  autoComplete="current-password"
                  value={senhaForm.senhaAtual}
                  onChange={(e) => setSenhaForm({ ...senhaForm, senhaAtual: e.target.value })}
                />
              </FnField>
              <FnField label="Nova senha">
                <FnPasswordInput
                  required
                  autoComplete="new-password"
                  value={senhaForm.novaSenha}
                  onChange={(e) => setSenhaForm({ ...senhaForm, novaSenha: e.target.value })}
                />
              </FnField>
              <FnField label="Confirmar nova senha">
                <FnPasswordInput
                  required
                  autoComplete="new-password"
                  value={senhaForm.confirmarSenha}
                  onChange={(e) => setSenhaForm({ ...senhaForm, confirmarSenha: e.target.value })}
                />
              </FnField>

              <FnErrorAlert erro={erroSenha ? { message: erroSenha } : null} />

              <div className="flex justify-end">
                <FnButton type="submit" disabled={salvandoSenha}>
                  {salvandoSenha ? 'Salvando...' : 'Trocar senha'}
                </FnButton>
              </div>
            </form>
          </section>
        </>
      )}

      <FnToast aberto={toastDadosAberto} onFechar={() => setToastDadosAberto(false)} mensagem="Dados atualizados." />
      <FnToast
        aberto={toastSenhaAberto}
        onFechar={() => setToastSenhaAberto(false)}
        mensagem="Senha alterada com sucesso."
      />
    </div>
  )
}
