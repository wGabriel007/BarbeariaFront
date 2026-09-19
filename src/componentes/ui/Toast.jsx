import { useEffect } from 'react'
import { FnIconAlerta, FnIconCheck, FnIconX } from './Icons'

// Ícone + cores do "selo" à esquerda — a única coisa que muda entre um
// toast de sucesso e um de erro (ver 'tipo' abaixo); o resto (posição,
// animação, botão de fechar) é sempre igual.
const TIPOS = {
  sucesso: {
    FnIcone: FnIconCheck,
    className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  erro: {
    FnIcone: FnIconAlerta,
    className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
}

// Cartão de aviso flutuante — substitui tanto o alert() quanto o
// confirm() nativos do navegador (feios, travam a página até clicar OK,
// e são a única coisa no sistema que não combina com o resto do
// visual — ver também ConfirmDialog.jsx pro confirm()) por um aviso que
// aparece com uma animação, some sozinho depois de um tempo, e pode ser
// fechado a qualquer momento. 'tipo' escolhe sucesso (padrão — ex.:
// "Plano solicitado com sucesso") ou erro (ex.: falha ao Fnativar um
// barbeiro) — não é um formulário, não bloqueia nada por trás.
export function FnToast({ mensagem, aberto, onFechar, duracaoMs = 6000, tipo = 'sucesso' }) {
  useEffect(() => {
    if (!aberto) return undefined
    const temporizador = setTimeout(onFechar, duracaoMs)
    return () => clearTimeout(temporizador)
  }, [aberto, onFechar, duracaoMs])

  if (!aberto) return null

  const { FnIcone, className } = TIPOS[tipo]

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:justify-end">
      <div className="flex w-full max-w-sm items-start gap-3 rounded-xl border border-brand-200 bg-surface p-4 shadow-xl animate-scale-in">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${className}`}>
          <FnIcone className="h-4 w-4" />
        </div>
        <p className="flex-1 pt-1 text-sm text-brand-800">{mensagem}</p>
        <button
          type="button"
          onClick={onFechar}
          className="shrink-0 rounded-full p-1 text-brand-400 transition-colors hover:bg-brand-100 hover:text-brand-700"
          aria-label="Fechar"
        >
          <FnIconX className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
