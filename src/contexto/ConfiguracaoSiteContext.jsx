import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { configuracaoSiteApi } from '../api/configuracaoSite'

const ConfiguracaoSiteContext = createContext(null)

// Escurece uma cor hex multiplicando cada Fncanal RGB — usado só pra
// derivar sozinho o tom de "hover" de um botão primário (brand-800) a
// partir da cor escolhida pelo Admin, sem precisar pedir uma segunda cor
// só pra isso.
function Fnescurecer(hex, fator) {
  const num = parseInt(hex.slice(1), 16)
  const Fncanal = (deslocamento) => {
    const valor = (num >> deslocamento) & 0xff
    return Math.max(0, Math.round(valor * (1 - fator)))
  }
  const FnparaHex = (v) => v.toString(16).padStart(2, '0')
  return `#${FnparaHex(Fncanal(16))}${FnparaHex(Fncanal(8))}${FnparaHex(Fncanal(0))}`
}

/**
 * Marca/aparência do site (nome, logo, cor de destaque) — carregada UMA
 * vez aqui, no topo da árvore (ver main.jsx), ANTES de saber se tem
 * alguém logado: a tela de FnLogin também precisa mostrar a marca certa da
 * barbearia (ver componentes/AuthLayout.jsx), e por isso
 * GET /api/configuracao-site é [AllowAnonymous] na Api de propósito.
 */
export function FnConfiguracaoSiteProvider({ children }) {
  const [config, setConfig] = useState(null)

  const Fnrecarregar = useCallback(() => {
    configuracaoSiteApi
      .Fnobter()
      .then(setConfig)
      .catch(() => {
        // Se a Api ainda não subiu ou a rota falhar por qualquer motivo,
        // o app inteiro não pode travar por causa disso — cada tela que
        // usa 'config' já sabe cair pro nome/ícone padrão quando ele
        // continua null (ver AuthLayout.jsx e Layout.jsx).
      })
  }, [])

  useEffect(() => {
    Fnrecarregar()
  }, [Fnrecarregar])

  // Sobrescreve só os tons "700"/"800" da paleta (botões, ícones, item
  // ativo do menu) com a cor escolhida pelo Admin — os outros tons (fundo,
  // texto, bordas) continuam os neutros padrão de propósito: recalcular
  // uma rampa inteira de 9 tons a partir de uma cor só tende a dar
  // resultado estranho (texto ilegível, contraste ruim) sem um mecanismo
  // de design bem mais elaborado do que cabe aqui.
  useEffect(() => {
    const raiz = document.documentElement.style
    if (config?.corPrimaria) {
      raiz.setProperty('--color-brand-700', config.corPrimaria)
      raiz.setProperty('--color-brand-800', Fnescurecer(config.corPrimaria, 0.15))
    } else {
      raiz.removeProperty('--color-brand-700')
      raiz.removeProperty('--color-brand-800')
    }
  }, [config?.corPrimaria])

  return (
    <ConfiguracaoSiteContext.Provider value={{ config, Fnrecarregar }}>{children}</ConfiguracaoSiteContext.Provider>
  )
}

export function useConfiguracaoSite() {
  const context = useContext(ConfiguracaoSiteContext)
  if (!context) {
    throw new Error('useConfiguracaoSite precisa ser usado dentro de <ConfiguracaoSiteProvider>.')
  }
  return context
}
