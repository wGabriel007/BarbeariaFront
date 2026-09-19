// Três estados que toda tela que busca dados da Api precisa mostrar:
// carregando, erro, e "não tem nada ainda". Centralizados aqui pra ficar
// visualmente idêntico em todo o app.

export function FnSpinner({ label = 'Carregando...' }) {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-brand-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-300 border-t-brand-700" />
      {label}
    </div>
  )
}

export function FnErrorAlert({ erro }) {
  if (!erro) return null
  return (
    <div className="animate-slide-up rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      {erro.message ?? String(erro)}
    </div>
  )
}

export function FnEmptyState({ children }) {
  return (
    <div className="animate-fade-in rounded-lg border border-dashed border-brand-200 py-10 text-center text-sm text-brand-500">
      {children}
    </div>
  )
}
