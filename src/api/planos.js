import { api } from './client'

export const planosApi = {
  Fnlistar: () => api.get('/planos-assinatura').then((r) => r.data),

  FnobterPorId: (id) => api.get(`/planos-assinatura/${id}`).then((r) => r.data),

  Fncriar: (dados) => api.post('/planos-assinatura', dados).then((r) => r.data),

  FnincluirServico: (planoId, dados) =>
    api.post(`/planos-assinatura/${planoId}/servicos`, dados).then((r) => r.data),

  Fninativar: (id) => api.post(`/planos-assinatura/${id}/inativar`),

  Fnativar: (id) => api.post(`/planos-assinatura/${id}/ativar`),
}
