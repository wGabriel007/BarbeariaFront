import { FnIconX } from './Icons'

// Mesma ideia do "tamanho" de FnAvatar (sm/lg) — a maioria dos formulários
// cabe confortavelmente em max-w-lg (o padrão, "md"), mas um conteúdo mais
// denso (ex.: o "cartão do cliente" em Usuarios.jsx, com estatísticas +
// duas listas de histórico) precisa de mais largura pra não empilhar
// tudo espremido.
const LARGURAS = {
  md: 'max-w-lg',
  lg: 'max-w-3xl',
}

// FnModal simples e genérico: qualquer formulário (Fncriar cliente, Fncriar
// serviço, novo agendamento...) entra como children. Fechar clicando no
// fundo ou no X — sem lib externa, só um <div> fixo cobrindo a tela.
// O fundo entra com um fade e o cartão com um leve "scale + subida" —
// dá a sensação de que o modal "aparece" em vez de só surgir de repente.
export function FnModal({ titulo, aberto, onFechar, tamanho = 'md', children }) {
  if (!aberto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
      onClick={onFechar}
    >
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-xl bg-surface p-6 shadow-xl animate-scale-in ${LARGURAS[tamanho]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-900">{titulo}</h2>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-full p-1 text-brand-400 transition-colors hover:bg-brand-100 hover:text-brand-700"
            aria-label="Fechar"
          >
            <FnIconX className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
