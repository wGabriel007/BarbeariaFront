import { api } from './client'

export const servicosApi = {
  Fnlistar: () => api.get('/servicos').then((r) => r.data),

  FnobterPorId: (id) => api.get(`/servicos/${id}`).then((r) => r.data),

  Fncriar: (dados) => api.post('/servicos', dados).then((r) => r.data),

  FnatualizarPreco: (id, novoPreco) =>
    api.patch(`/servicos/${id}/preco`, { novoPreco }).then((r) => r.data),

  FnatualizarCategoria: (id, novaCategoria) =>
    api.patch(`/servicos/${id}/categoria`, { novaCategoria }).then((r) => r.data),

  Fninativar: (id) => api.post(`/servicos/${id}/inativar`),

  Fnativar: (id) => api.post(`/servicos/${id}/ativar`),
}
