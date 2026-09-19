import { api } from './client'

// Cada função aqui espelha uma rota do ClientesController (Barbearia.Api).
// Nomes em português, iguais aos usados no back, de propósito — fica
// fácil de achar "quem chama o quê" sem precisar traduzir mentalmente.
export const clientesApi = {
  Fnlistar: () => api.get('/clientes').then((r) => r.data),

  FnobterPorId: (id) => api.get(`/clientes/${id}`).then((r) => r.data),

  // "Cartão do cliente" aberto a partir da aba Usuários, que só conhece o
  // Id do Usuario — o back resolve o Cliente vinculado a ele (ver
  // ClienteService.ObterDetalhePorUsuarioIdAsync).
  FnobterDetalhePorUsuario: (usuarioId) => api.get(`/clientes/por-usuario/${usuarioId}`).then((r) => r.data),

  // usuarioId precisa ser de um Usuario Comum já existente — não existe
  // mais "criar do zero" (ver PromoverClienteRequest no back).
  Fnpromover: (usuarioId) => api.post('/clientes', { usuarioId }).then((r) => r.data),

  Fnatualizar: (id, dados) => api.put(`/clientes/${id}`, dados).then((r) => r.data),

  Fnativar: (id) => api.post(`/clientes/${id}/ativar`),

  Fninativar: (id) => api.post(`/clientes/${id}/inativar`),

  Fnbloquear: (id) => api.post(`/clientes/${id}/bloquear`),
}
