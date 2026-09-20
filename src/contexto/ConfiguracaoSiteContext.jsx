import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { configuracaoSiteApi } from '../api/configuracaoSite'
import { FnsetEmpresaSlug } from '../api/client'

const ConfiguracaoSiteContext = createContext(null)

// Nomes reservados pra rotas de nível raiz que NÃO são o slug de uma
// barbearia (ver App.jsx e a mesma lista em Barbearia.Domain.Entidades.
// Empresa.SlugsReservados, na Api — nenhuma barbearia consegue nascer
// com um desses nomes, exatamente pra essa conta bater dos dois lados).
const SEGMENTOS_SEM_SLUG = new Set(['admin', 'login', 'cadastro', 'api', 'app', 'static', 'assets'])

// Tira o "apelido" da barbearia direto da URL atual (primeiro pedaço do
// caminho) — ex.: "/barbearia-do-joao/agenda" -> "barbearia-do-joao".
// Sem slug (raiz "/", ou área "/admin/...") devolve null.
function FnslugDaUrl(pathname) {
  const primeiroSegmento = pathname.split('/').filter(Boolean)[0]
  if (!primeiroSegmento || SEGMENTOS_SEM_SLUG.has(primeiroSegmento)) return null
  return primeiroSegmento
}

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
 *
 * Multi-barbearia: fica ACIMA das <Routes> (ver main.jsx), então não dá
 * pra usar useParams() pra saber o slug da barbearia atual — em vez
 * disso lê direto da URL com useLocation() (funciona em qualquer lugar
 * dentro do <BrowserRouter>) e repassa pro client.js via
 * FnsetEmpresaSlug(), que é quem de fato manda o header X-Empresa-Slug
 * em toda requisição (ver EmpresaResolverMiddleware na Api). Refaz a
 * busca toda vez que o slug muda — troca de barbearia sem recarregar a
 * página inteira (raro, mas pode acontecer se alguém colar outro link
 * na mesma aba) não pode continuar mostrando a marca da barbearia
 * anterior.
 */
export function FnConfiguracaoSiteProvider({ children }) {
  const location = useLocation()
  const slug = FnslugDaUrl(location.pathname)
  const [config, setConfig] = useState(null)
  // true quando a última busca voltou 404 (link com slug errado, ou de
  // barbearia inativa — ver ConfiguracaoSiteRepository.FnObterAsync na
  // Api) — paginas/BarbeariaNaoEncontrada.jsx usa isso pra mostrar um
  // aviso amigável em vez de deixar a tela inteira quebrada/em branco.
  const [naoEncontrada, setNaoEncontrada] = useState(false)

  const Fnrecarregar = useCallback(() => {
    // Sem slug (raiz "/" ou área "/admin/...") não existe barbearia
    // nenhuma pra buscar — nem tenta, só garante que uma config antiga
    // (de uma barbearia visitada antes, na mesma aba) não fique presa.
    if (!slug) {
      setConfig(null)
      setNaoEncontrada(false)
      return
    }

    configuracaoSiteApi
      .Fnobter()
      .then((dados) => {
        setConfig(dados)
        setNaoEncontrada(false)
      })
      .catch((err) => {
        setConfig(null)
        setNaoEncontrada(err.response?.status === 404)
        // Qualquer outro erro (rede, Api fora do ar) não trava o app —
        // cada tela que usa 'config' já sabe cair pro nome/ícone padrão
        // quando ele continua null (ver AuthLayout.jsx e Layout.jsx).
      })
  }, [slug])

  useEffect(() => {
    FnsetEmpresaSlug(slug)
    Fnrecarregar()
  }, [slug, Fnrecarregar])

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
    <ConfiguracaoSiteContext.Provider value={{ config, Fnrecarregar, slug, naoEncontrada }}>
      {children}
    </ConfiguracaoSiteContext.Provider>
  )
}

export function useConfiguracaoSite() {
  const context = useContext(ConfiguracaoSiteContext)
  if (!context) {
    throw new Error('useConfiguracaoSite precisa ser usado dentro de <ConfiguracaoSiteProvider>.')
  }
  return context
}
