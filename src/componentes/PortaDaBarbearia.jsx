import { useConfiguracaoSite } from '../contexto/ConfiguracaoSiteContext'
import { FnBarbeariaNaoEncontrada } from '../paginas/BarbeariaNaoEncontrada'

// Embrulha TODA a árvore de rotas "/:slug/*" (login, cadastro e o painel
// inteiro — ver App.jsx). Se o slug da URL não bater com nenhuma
// barbearia ativa, troca o que quer que fosse aparecer por uma tela
// amigável, em vez de deixar cada página (FnLogin, FnLayout, ...) lidar
// com esse caso sozinha (ver ConfiguracaoSiteContext.naoEncontrada).
export function FnPortaDaBarbearia({ children }) {
  const { naoEncontrada } = useConfiguracaoSite()

  if (naoEncontrada) {
    return <FnBarbeariaNaoEncontrada />
  }

  return children
}
