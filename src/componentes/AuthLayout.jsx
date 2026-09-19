import { FnurlArquivo } from '../api/client'
import { useConfiguracaoSite } from '../contexto/ConfiguracaoSiteContext'
import { useTema } from '../ganchos/useTema'
import { FnIconCalendario, FnIconClipboard, FnIconLogo, FnIconTema, FnIconUsuario } from './ui/Icons'

const DESTAQUES = [
  { FnIcone: FnIconCalendario, texto: 'Agenda sem conflito de horário — o sistema recusa dois cortes no mesmo horário' },
  { FnIcone: FnIconUsuario, texto: 'Cadastro de clientes com histórico de atendimentos' },
  { FnIcone: FnIconClipboard, texto: 'Planos de assinatura com serviços inclusos e limite mensal' },
]

// Molde visual das telas de FnLogin e FnCadastro: painel de marca à esquerda
// (só aparece em telas largas — "lg:") + o formulário centralizado à
// direita. Em telas estreitas (celular), o painel de marca desaparece e
// só fica o cartão do formulário, ocupando a tela toda — por isso o
// logo também aparece dentro do cartão, não só no painel esquerdo.
export function FnAuthLayout({ titulo, subtitulo, children }) {
  const { config } = useConfiguracaoSite()
  const { escuro, Fnalternar } = useTema()
  const nomeBarbearia = config?.nomeBarbearia ?? 'Barbearia'

  return (
    <div className="relative flex min-h-screen bg-brand-50">
      <button
        type="button"
        onClick={Fnalternar}
        className="absolute right-4 top-4 z-10 rounded-lg p-2 text-brand-500 transition-colors hover:bg-brand-100 lg:text-white lg:hover:bg-white/10"
        aria-label={escuro ? 'Ativar modo claro' : 'Ativar modo escuro'}
        title={escuro ? 'Modo claro' : 'Modo escuro'}
      >
        <FnIconTema escuro={escuro} className="h-5 w-5" />
      </button>

      {/* Painel de marca à esquerda: sempre escuro, em cima da cor de
          fundo do próprio sistema — deixa a "cara" da tela de Fnlogin
          consistente entre modo claro/escuro, em vez de virar um degradê
          claro-sobre-claro (ilegível) quando o modo escuro inverte a
          paleta brand-* inteira (ver ":root.dark" em index.css). */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-slate-800 to-slate-950 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          {config?.logoUrl ? (
            <img src={FnurlArquivo(config.logoUrl)} alt={nomeBarbearia} className="h-7 w-7 shrink-0 rounded object-contain" />
          ) : (
            <FnIconLogo className="h-7 w-7 shrink-0" />
          )}
          <div>
            <h1 className="text-2xl font-bold leading-tight">{nomeBarbearia}</h1>
            <p className="text-slate-300">painel de gestão</p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold leading-tight">
            Sua barbearia organizada, do agendamento à assinatura.
          </h2>
          <ul className="space-y-4">
            {DESTAQUES.map((d, indice) => (
              <li
                key={d.texto}
                className="flex items-start gap-3 text-sm text-slate-200 animate-slide-up"
                style={{ animationDelay: `${indice * 80}ms` }}
              >
                <d.FnIcone className="h-5 w-5 shrink-0" />
                <span>{d.texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-400">
          Sistema desenvolvido sob medida — clientes, serviços, barbeiros e agenda em um só lugar.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="mb-8 flex items-center gap-2 lg:block">
            {config?.logoUrl ? (
              <img
                src={FnurlArquivo(config.logoUrl)}
                alt={nomeBarbearia}
                className="h-8 w-8 shrink-0 rounded object-contain lg:hidden"
              />
            ) : (
              <FnIconLogo className="h-8 w-8 shrink-0 text-brand-700 lg:hidden" />
            )}
            <div>
              <h2 className="text-2xl font-semibold text-brand-900">{titulo}</h2>
              {subtitulo && <p className="mt-1 text-sm text-brand-500">{subtitulo}</p>}
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
