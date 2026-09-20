import { useNavigate } from 'react-router-dom'
import { FnButton } from '../componentes/ui/Button'
import { FnIconAlerta } from '../componentes/ui/Icons'

// Catch-all de App.jsx ("*") — qualquer URL que não bata com nenhuma
// rota conhecida (landing, /admin/..., /:slug/...) cai aqui, em vez de
// numa tela em branco. Genérica de propósito: neste ponto ainda nem
// sabemos se a pessoa quis dizer uma barbearia (ver
// paginas/BarbeariaNaoEncontrada.jsx, mais específica, usada só quando
// JÁ se sabe que o slug é de barbearia e não bateu).
export function FnNaoEncontrada() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 p-6">
      <div className="w-full max-w-sm animate-scale-in rounded-2xl border border-brand-200 bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
          <FnIconAlerta className="h-7 w-7 text-brand-500" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-brand-900">Página não encontrada</h1>
        <p className="mt-2 text-sm text-brand-500">O endereço que você acessou não existe.</p>
        <FnButton variant="secondary" className="mt-6 w-full" onClick={() => navigate('/')}>
          Voltar ao início
        </FnButton>
      </div>
    </div>
  )
}
