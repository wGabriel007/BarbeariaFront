import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexto/AuthContext'
import { useCaminhoBarbearia } from '../ganchos/useCaminhoBarbearia'
import { FnAuthLayout } from '../componentes/AuthLayout'
import { FnButton } from '../componentes/ui/Button'
import { FnField, FnInput, FnPasswordInput } from '../componentes/ui/Field'
import { FnErrorAlert } from '../componentes/ui/Feedback'

export function FnLogin() {
  const { Fnlogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const Fncaminho = useCaminhoBarbearia()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState(null)

  async function Fnenviar(e) {
    e.preventDefault()
    setEntrando(true)
    setErro(null)

    try {
      await Fnlogin(email, senha)
      // Se a pessoa foi mandada pro /login a partir de uma rota
      // protegida (ver RotaProtegida.jsx), volta pra ONDE ela queria
      // ir, em vez de sempre cair na FnAgenda.
      const destino = location.state?.de?.pathname ?? Fncaminho()
      navigate(destino, { replace: true })
    } catch (err) {
      setErro(err.message)
    } finally {
      setEntrando(false)
    }
  }

  return (
    <FnAuthLayout titulo="Entrar" subtitulo="Acesse o painel da sua barbearia.">
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

        <p className="text-center text-sm text-brand-500">
          Ainda não tem conta?{' '}
          <Link to={Fncaminho('/cadastro')} className="font-medium text-brand-700 hover:underline">
            Criar conta
          </Link>
        </p>
      </form>
    </FnAuthLayout>
  )
}
