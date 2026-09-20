import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexto/AuthContext'
import { FnButton } from '../componentes/ui/Button'
import { FnField, FnInput, FnPasswordInput } from '../componentes/ui/Field'
import { FnErrorAlert } from '../componentes/ui/Feedback'
import { FnIconLogo } from '../componentes/ui/Icons'

// Login do SuperAdmin (dono da plataforma) — tela própria, separada de
// paginas/Login.jsx, porque não existe barbearia nenhuma aqui pra
// mostrar marca/logo (ConfiguracaoSiteContext.slug é null em "/admin/...",
// ver App.jsx) e porque bate em POST /auth/login-admin, não /auth/login.
export function FnAdminLogin() {
  const { FnloginAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState(null)

  async function Fnenviar(e) {
    e.preventDefault()
    setEntrando(true)
    setErro(null)

    try {
      await FnloginAdmin(email, senha)
      const destino = location.state?.de?.pathname ?? '/admin'
      navigate(destino, { replace: true })
    } catch (err) {
      setErro(err.message)
    } finally {
      setEntrando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 p-6">
      <div className="w-full max-w-sm animate-scale-in rounded-2xl bg-surface p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-white">
            <FnIconLogo className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-brand-900">Área administrativa</h1>
            <p className="text-xs text-brand-400">gestão da plataforma</p>
          </div>
        </div>

        <form onSubmit={Fnenviar} className="space-y-4">
          <FnField label="E-mail">
            <FnInput
              type="email"
              autoFocus
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FnField>

          <FnField label="Senha">
            <FnPasswordInput
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </FnField>

          <FnErrorAlert erro={erro ? { message: erro } : null} />

          <FnButton type="submit" className="w-full" disabled={entrando}>
            {entrando ? 'Entrando...' : 'Entrar'}
          </FnButton>
        </form>
      </div>
    </div>
  )
}
