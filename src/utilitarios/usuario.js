// "Cliente" não é um Tipo de conta de verdade (o back só tem Admin/Barbeiro/
// Comum — ver Barbearia.Domain.Enums.TipoUsuario) — vincular um usuário
// Comum a um cadastro de Cliente (ver ClienteService.PromoverAsync) nunca
// muda o Tipo dele, só acrescenta 'ehCliente: true' na resposta da Api
// (ver comentário em UsuarioResponse). Esta função só decide qual RÓTULO
// mostrar nas telas: "Cliente" no lugar de "Comum" pra quem já tem esse
// vínculo, sem fingir que a permissão da pessoa mudou.
export function FnrotuloTipoUsuario(usuario) {
  if (usuario?.tipo === 'Comum' && usuario?.ehCliente) return 'Cliente'
  return usuario?.tipo
}
