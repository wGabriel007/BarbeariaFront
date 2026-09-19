import { api } from './client'

export const pagamentosApi = {
  // de/ate: objetos Date do JS — mesmo formato de
  // agendamentosApi.FnlistarPorBarbeiroEPeriodo (ISO 8601, que o
  // DateTimeOffset do C# entende).
  FnlistarPorPeriodo: (de, ate) =>
    api
      .get('/pagamentos', { params: { de: de.toISOString(), ate: ate.toISOString() } })
      .then((r) => r.data),

  Fnconfirmar: (id, forma) => api.post(`/pagamentos/${id}/confirmar`, { forma }).then((r) => r.data),
  Fncancelar: (id) => api.post(`/pagamentos/${id}/cancelar`).then((r) => r.data),

  // Histórico completo (qualquer status) de UM cliente — usado no
  // "cartão do cliente" da aba Usuários (ver Usuarios.jsx).
  FnlistarPorCliente: (clienteId) => api.get(`/pagamentos/por-cliente/${clienteId}`).then((r) => r.data),
}
