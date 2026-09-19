import { useCallback, useState } from 'react'

/**
 * Padrão que se repete em toda ação rápida de linha (Fnativar/Fninativar,
 * Fncancelar, remover um horário...): antes, um erro nessas ações virava
 * um alert() nativo do navegador — feio e destoante do resto do app (ver
 * componentes/ui/Toast.jsx). Agora, `FnmostrarErro(err.message)` guarda a
 * mensagem e a própria página renderiza um <FnToast tipo="erro" .../>
 * com ela — igual ao toast de sucesso que já existia, só que vermelho.
 *
 * Uso:
 *   const { erro, FnmostrarErro, FnfecharErro } = useToastErro()
 *   ...
 *   } catch (err) { FnmostrarErro(err.message) }
 *   ...
 *   <FnToast aberto={!!erro} mensagem={erro ?? ''} tipo="erro" onFechar={FnfecharErro} />
 */
export function useToastErro() {
  const [erro, setErro] = useState(null)

  const FnmostrarErro = useCallback((mensagem) => setErro(mensagem), [])
  const FnfecharErro = useCallback(() => setErro(null), [])

  return { erro, FnmostrarErro, FnfecharErro }
}
