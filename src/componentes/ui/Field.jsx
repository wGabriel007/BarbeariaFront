import { useState } from 'react'
import { FnIconBusca, FnIconOlho, FnIconOlhoFechado, FnIconX } from './Icons'

// "Field" empacota label + input/select/textarea + mensagem de erro, pra
// não repetir essa estrutura de <label><input/>{erro && ...} em todo
// formulário. Recebe o próprio elemento de input como children.
export function FnField({ label, erro, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-brand-800">{label}</span>
      {children}
      {hint && !erro && <span className="mt-1 block text-xs text-brand-500">{hint}</span>}
      {erro && <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{erro}</span>}
    </label>
  )
}

const baseInputClasses =
  'w-full rounded-lg border border-brand-300 bg-surface px-3 py-2 text-sm text-brand-900 ' +
  'placeholder:text-brand-400 focus:border-brand-600 focus:outline focus:outline-2 focus:outline-brand-200'

export function FnInput({ className = '', ...props }) {
  return <input className={`${baseInputClasses} ${className}`} {...props} />
}

export function FnSelect({ className = '', children, ...props }) {
  return (
    <select className={`${baseInputClasses} ${className}`} {...props}>
      {children}
    </select>
  )
}

export function FnTextarea({ className = '', ...props }) {
  return <textarea className={`${baseInputClasses} ${className}`} rows={3} {...props} />
}

// Campo de busca com lupa à esquerda e um "x" pra limpar à direita (só
// aparece com texto digitado) — usado nas telas com lista grande de
// pessoas (Clientes, Usuários, Pagamentos) pra filtrar por nome/e-mail
// sem precisar rolar a tabela inteira. Recebe 'value'/'onChange' já como
// string pronta (não o evento), pra quem usa não precisar escrever
// "e.target.value" de novo em cada tela — ver utilitarios/busca.js pro
// FnCorresponde que faz o filtro de verdade.
export function FnCampoBusca({ value, onChange, placeholder = 'Buscar por nome...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-brand-400">
        <FnIconBusca className="h-4 w-4" />
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${baseInputClasses} pl-9 ${value ? 'pr-9' : ''}`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-brand-400 transition-colors hover:text-brand-700"
          aria-label="Limpar busca"
        >
          <FnIconX className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// Campo de senha com um botão de "mostrar/ocultar" — pequeno detalhe de
// UX que evita o erro de digitação silencioso (a pessoa não sabe se
// errou uma letra até apertar "Entrar" e falhar).
export function FnPasswordInput({ className = '', ...props }) {
  const [visivel, setVisivel] = useState(false)

  return (
    <div className="relative">
      <input
        type={visivel ? 'text' : 'password'}
        className={`${baseInputClasses} pr-10 ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-brand-400 transition-colors hover:text-brand-700"
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        tabIndex={-1}
      >
        {visivel ? <FnIconOlhoFechado className="h-5 w-5" /> : <FnIconOlho className="h-5 w-5" />}
      </button>
    </div>
  )
}
