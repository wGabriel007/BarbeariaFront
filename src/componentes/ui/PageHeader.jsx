export function FnPageHeader({ titulo, descricao, Fnacao }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-brand-500">{descricao}</p>}
      </div>
      {Fnacao}
    </div>
  )
}
