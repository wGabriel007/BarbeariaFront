import { useCallback, useEffect, useState } from 'react'

/**
 * Padrão que se repete em TODA tela que lista dados: disparar uma
 * chamada à Api quando o componente monta, guardar o resultado, mostrar
 * "carregando..." enquanto isso, e mostrar o erro se der problema.
 *
 * Em vez de reescrever esses 3 useState + useEffect em cada página,
 * concentramos aqui uma vez. `recarregar()` é devolvido pra quem
 * precisa Fnatualizar a lista depois de Fncriar/editar/excluir algo.
 *
 * Uso:
 *   const { dados: clientes, carregando, erro, Fnrecarregar } = useAsync(
 *     () => clientesApi.Fnlistar(),
 *     [], // dependências — refaz a busca se algo aqui mudar
 *   )
 */
export function useAsync(funcaoAssincrona, dependencias = []) {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  // useCallback garante que 'recarregar' só muda de identidade quando as
  // dependências mudam — evita loop infinito se ele for usado dentro de
  // outro useEffect.
  const Fnrecarregar = useCallback(() => {
    let cancelado = false

    setCarregando(true)
    setErro(null)

    funcaoAssincrona()
      .then((resultado) => {
        if (!cancelado) setDados(resultado)
      })
      .catch((err) => {
        if (!cancelado) setErro(err)
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    // Função de limpeza: se o componente desmontar (ou as dependências
    // mudarem de novo) antes da chamada terminar, ignoramos o resultado
    // — evita o clássico warning de "setState em componente desmontado".
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias)

  useEffect(() => Fnrecarregar(), [Fnrecarregar])

  return { dados, carregando, erro, Fnrecarregar }
}
