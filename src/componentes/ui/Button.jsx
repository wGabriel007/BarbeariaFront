// Componente de botão único, com "variantes" (primary/secondary/danger/
// ghost) escolhidas por uma prop — em vez de decorar className toda vez
// que usar um botão, escolhe-se a variante e ele já sai com a cor certa.
// Isso é o que dá aquela sensação de "sistema" em vez de "cada botão com
// uma cor diferente".
const VARIANTES = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 focus-visible:outline-brand-700',
  secondary:
    'bg-surface text-brand-700 border border-brand-300 hover:bg-brand-50 focus-visible:outline-brand-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  ghost: 'text-brand-700 hover:bg-brand-100 focus-visible:outline-brand-500',
}

export function FnButton({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium
        transition-all duration-150 ease-out active:scale-[0.97]
        disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        ${VARIANTES[variant]} ${className}`}
      {...props}
    />
  )
}
