import { useCallback, useRef, useState } from 'react'
import { FnModal } from './Modal'
import { FnButton } from './Button'

/**
 * Substitui o confirm() nativo do navegador (a caixinha "localhost:5173
 * diz... OK/Cancelar" — feia, trava a página, e é a única coisa no
 * sistema que não combina com o resto do visual) por um FnModal comum,
 * mas resolvido como uma Promise<boolean> — pra trocar `if (!confirm(...))
 * return` por `if (!(await Fnconfirmar(...))) return` sem reescrever a
 * lógica de quem chama.
 *
 * Uso:
 *   const { Fnconfirmar, elemento: dialogoConfirmacao } = useConfirmacao()
 *   ...
 *   async function FncancelarAlgo(x) {
 *     if (!(await Fnconfirmar('Cancelar este agendamento?'))) return
 *     ...
 *   }
 *   ...
 *   return <div>... {dialogoConfirmacao} </div>
 *
 * Só UM diálogo por vez (não é uma fila) — o bastante pra ação de linha
 * de uma tela, que é sempre um clique por vez.
 */
export function useConfirmacao() {
  const [estado, setEstado] = useState(null)
  const resolverRef = useRef(null)

  const Fnconfirmar = useCallback((mensagem, opcoes = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setEstado({
        mensagem,
        titulo: opcoes.titulo ?? 'Confirmar ação',
        textoConfirmar: opcoes.textoConfirmar ?? 'Confirmar',
        variant: opcoes.variant ?? 'primary',
      })
    })
  }, [])

  function Fnresolver(valor) {
    resolverRef.current?.(valor)
    resolverRef.current = null
    setEstado(null)
  }

  const elemento = estado && (
    <FnModal titulo={estado.titulo} aberto onFechar={() => Fnresolver(false)}>
      <p className="text-sm text-brand-700">{estado.mensagem}</p>
      <div className="mt-6 flex justify-end gap-2">
        <FnButton type="button" variant="secondary" onClick={() => Fnresolver(false)}>
          Cancelar
        </FnButton>
        <FnButton type="button" variant={estado.variant} onClick={() => Fnresolver(true)}>
          {estado.textoConfirmar}
        </FnButton>
      </div>
    </FnModal>
  )

  return { Fnconfirmar, elemento }
}
