import { api } from './client'

// Cada função aqui espelha uma rota do SolicitacoesPlanoController (Barbearia.Api).
export const solicitacoesPlanoApi = {
  Fnsolicitar: (dados) => api.post('/solicitacoes-planos', dados).then((r) => r.data),

  FnlistarPendentes: () => api.get('/solicitacoes-planos/pendentes').then((r) => r.data),

  FnlistarMeus: () => api.get('/solicitacoes-planos/meus').then((r) => r.data),

  Fnaceitar: (id, dados) => api.post(`/solicitacoes-planos/${id}/aceitar`, dados).then((r) => r.data),

  Fnrejeitar: (id, mensagem) =>
    api.post(`/solicitacoes-planos/${id}/rejeitar`, { mensagem: mensagem || null }).then((r) => r.data),
}
