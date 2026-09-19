// Compara texto ignorando maiúsculas/minúsculas E acentos — assim
// digitar "joao" no campo de busca (ver componentes/ui/Field.jsx,
// FnCampoBusca) acha "João", "jose" acha "José", etc. Usado nas telas
// com lista grande de pessoas (Clientes, Usuários, Pagamentos) pra
// filtrar por nome/e-mail sem precisar rolar a tabela inteira.
function FnnormalizarBusca(texto) {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

// 'busca' vazia (ainda não digitou nada) sempre "combina" — é o que faz
// a lista aparecer inteira antes da pessoa começar a filtrar.
export function FnCorresponde(campo, busca) {
  if (!busca) return true
  return FnnormalizarBusca(campo).includes(FnnormalizarBusca(busca))
}
