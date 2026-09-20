import { useParams } from 'react-router-dom'

/**
 * Devolve uma função que monta uma URL DENTRO da barbearia atual,
 * prefixando com o "apelido" (slug) dela — ver App.jsx: toda rota do
 * painel (FnLogin, FnCadastro, FnLayout e tudo dentro dele) vive sob
 * "/:slug/...". Em vez de cada página remontar esse prefixo na mão
 * (e arriscar esquecer/errar em alguma), usa-se este hook.
 *
 * Só funciona dentro da árvore de rotas "/:slug/*" (exatamente onde é
 * usado) — fora dela useParams() não teria "slug" pra devolver.
 *
 * Exemplos: Fncaminho() -> "/barbearia-do-joao"
 *           Fncaminho('/agenda') -> "/barbearia-do-joao/agenda"
 */
export function useCaminhoBarbearia() {
  const { slug } = useParams()
  return function Fncaminho(sufixo = '') {
    return `/${slug}${sufixo}`
  }
}
