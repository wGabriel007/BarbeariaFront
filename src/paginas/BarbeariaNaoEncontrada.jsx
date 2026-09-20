import { useNavigate } from 'react-router-dom'
import { FnButton } from '../componentes/ui/Button'
import { FnIconLoja } from '../componentes/ui/Icons'

// Mostrada no lugar de FnLogin/FnCadastro/FnLayout sempre que o slug da URL
// não corresponde a nenhuma barbearia ativa (ver ConfiguracaoSiteContext.
// naoEncontrada, alimentado pelo 404 de GET /api/configuracao-site — ver
// ConfiguracaoSiteRepository.FnObterAsync na Api) — link digitado errado,
// barbearia removida, ou desativada pelo SuperAdmin. Usada por
// componentes/PortaDaBarbearia.jsx, que embrulha toda a árvore "/:slug/*".
export function FnBarbeariaNaoEncontrada() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 p-6">
      <div className="w-full max-w-sm animate-scale-in rounded-2xl border border-brand-200 bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
          <FnIconLoja className="h-7 w-7 text-brand-500" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-brand-900">Barbearia não encontrada</h1>
        <p className="mt-2 text-sm text-brand-500">
          Não encontramos nenhuma barbearia neste link. Confira se o endereço está certo, ou peça um link novo pra
          barbearia.
        </p>
        <FnButton variant="secondary" className="mt-6 w-full" onClick={() => navigate('/')}>
          Voltar ao início
        </FnButton>
      </div>
    </div>
  )
}
