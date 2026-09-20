import { Link } from 'react-router-dom'
import { FnIconCalendario, FnIconClipboard, FnIconLogo, FnIconUsuario } from '../componentes/ui/Icons'

const DESTAQUES = [
  { FnIcone: FnIconCalendario, texto: 'Agenda sem conflito de horário' },
  { FnIcone: FnIconUsuario, texto: 'Clientes e histórico de atendimentos' },
  { FnIcone: FnIconClipboard, texto: 'Planos de assinatura, do jeito da sua barbearia' },
]

// Página da raiz "/" — não pertence a nenhuma barbearia (ver
// ConfiguracaoSiteContext.slug, que devolve null aqui). Cada barbearia
// tem seu PRÓPRIO link (ver App.jsx, "/:slug/..."), então esta tela não
// tenta listar/procurar barbearia nenhuma — só explica o que é o sistema
// e dá um jeito discreto do SuperAdmin (o dono da plataforma) chegar na
// área dele, em /admin.
export function FnLanding() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-800 to-slate-950 text-white">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="animate-scale-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <FnIconLogo className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl">
            Sistema de gestão para barbearias
          </h1>
          <p className="mx-auto mt-4 max-w-md text-slate-300">
            Se você é cliente de uma barbearia parceira, acesse pelo link exclusivo dela — o mesmo que ela te
            enviou ou divulgou.
          </p>

          <ul className="mx-auto mt-10 flex max-w-lg flex-col gap-4 text-left sm:flex-row sm:justify-center">
            {DESTAQUES.map((d, indice) => (
              <li
                key={d.texto}
                className="flex items-start gap-3 rounded-xl bg-white/5 p-4 text-sm text-slate-200 animate-slide-up sm:flex-1"
                style={{ animationDelay: `${indice * 80}ms` }}
              >
                <d.FnIcone className="h-5 w-5 shrink-0" />
                <span>{d.texto}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center">
        <Link to="/admin/login" className="text-xs text-slate-400 hover:text-slate-200 hover:underline">
          Sou administrador da plataforma
        </Link>
      </div>
    </div>
  )
}
