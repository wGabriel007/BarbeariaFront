import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexto/AuthContext'
import { useCaminhoBarbearia } from '../ganchos/useCaminhoBarbearia'
import { FnAuthLayout } from '../componentes/AuthLayout'
import { FnButton } from '../componentes/ui/Button'
import { FnField, FnInput, FnPasswordInput } from '../componentes/ui/Field'
import { FnErrorAlert } from '../componentes/ui/Feedback'

export function FnCadastro() {
  const { Fnregistrar } = useAuth()
  const navigate = useNavigate()
  const Fncaminho = useCaminhoBarbearia()

  const [form, setForm] = useState({ nomeCompleto: '', email: '', telefone: '', senha: '', confirmarSenha: '' })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  async function Fnenviar(e) {
    e.preventDefault()
    setErro(null)

    // Checagem só de UX (a Api não recebe "confirmarSenha" — ver
    // api/auth.js) — evita o clássico "digitei a senha errada na
    // segunda caixa e só descobri no próximo login".
    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    setEnviando(true)
    try {
      await Fnregistrar({
        nomeCompleto: form.nomeCompleto,
        email: form.email,
        telefone: form.telefone,
        senha: form.senha,
      })
      navigate(Fncaminho(), { replace: true })
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <FnAuthLayout titulo="Criar conta" subtitulo="Crie sua conta para acessar o sistema da barbearia.">
      <form onSubmit={Fnenviar} className="space-y-4">
        <FnField label="Nome completo">
          <FnInput
            autoFocus
            required
            value={form.nomeCompleto}
            onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
          />
        </FnField>

        <FnField label="E-mail">
          <FnInput
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </FnField>

        <FnField label="Telefone" hint="Contato direto da barbearia com você.">
          <FnInput
            required
            type="tel"
            placeholder="11999990000"
            autoComplete="tel"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />
        </FnField>

        <FnField label="Senha" hint="Mínimo de 6 caracteres.">
          <FnPasswordInput
            required
            minLength={6}
            autoComplete="new-password"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
          />
        </FnField>

        <FnField label="Confirmar senha">
          <FnPasswordInput
            required
            minLength={6}
            autoComplete="new-password"
            value={form.confirmarSenha}
            onChange={(e) => setForm({ ...form, confirmarSenha: e.target.value })}
          />
        </FnField>

        <FnErrorAlert erro={erro ? { message: erro } : null} />

        <FnButton type="submit" className="w-full" disabled={enviando}>
          {enviando ? 'Criando conta...' : 'Criar conta'}
        </FnButton>

        <p className="text-center text-sm text-brand-500">
          Já tem conta?{' '}
          <Link to={Fncaminho('/login')} className="font-medium text-brand-700 hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </FnAuthLayout>
  )
}
