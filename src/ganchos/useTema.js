import { useCallback, useEffect, useState } from 'react'

const CHAVE_TEMA = 'barbearia:tema'

function FnlerTemaSalvo() {
  try {
    const salvo = localStorage.getItem(CHAVE_TEMA)
    if (salvo === 'claro' || salvo === 'escuro') return salvo
  } catch {
    // localStorage indisponível (aba anônima com bloqueio, etc.) — cai
    // pro padrão do sistema operacional/navegador abaixo.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'
}

/**
 * Alterna entre modo claro/escuro pra QUALQUER usuário — é preferência
 * pessoal de exibição (como em qualquer app), não uma configuração do
 * Admin. Aplica a classe "dark" no <html> (ver index.css,
 * @custom-variant dark, e a paleta invertida em ":root.dark") e lembra a
 * escolha entre sessões via localStorage; sem nada salvo ainda, começa
 * seguindo o tema do sistema operacional.
 */
export function useTema() {
  const [tema, setTema] = useState(FnlerTemaSalvo)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'escuro')
    try {
      localStorage.setItem(CHAVE_TEMA, tema)
    } catch {
      // Sem localStorage, a escolha só vale enquanto esta aba ficar aberta.
    }
  }, [tema])

  const Fnalternar = useCallback(() => {
    setTema((atual) => (atual === 'escuro' ? 'claro' : 'escuro'))
  }, [])

  return { tema, escuro: tema === 'escuro', Fnalternar }
}
