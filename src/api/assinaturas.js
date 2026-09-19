import { api } from './client'

export const assinaturasApi = {
  FnlistarPorCliente: (clienteId) =>
    api.get(`/assinaturas/por-cliente/${clienteId}`).then((r) => r.data),

  // "Meu Plano": as assinaturas do próprio usuário logado (ver
  // AssinaturaService.ListarMinhasAsync) — lista vazia se ele ainda não
  // tem um Cliente/assinatura, nunca 404.
  FnlistarMinhas: () => api.get('/assinaturas/minhas').then((r) => r.data),

  Fncriar: (dados) => api.post('/assinaturas', dados).then((r) => r.data),

  Fnsuspender: (id) => api.post(`/assinaturas/${id}/suspender`),

  Fnreativar: (id) => api.post(`/assinaturas/${id}/reativar`),

  // dataCancelamento: string "YYYY-MM-DD" (DateOnly do C#)
  Fncancelar: (id, dataCancelamento) =>
    api.post(`/assinaturas/${id}/cancelar`, null, { params: { dataCancelamento } }),

  // Self-service: o próprio cliente cancelando a própria assinatura, sem
  // escolher data (o back usa "agora") — ver AssinaturaService.CancelarMinhaAsync.
  FncancelarMinha: (id) => api.post(`/assinaturas/${id}/cancelar-minha`),
}
