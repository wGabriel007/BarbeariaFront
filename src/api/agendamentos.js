import { api } from './client'

export const agendamentosApi = {
  FnobterPorId: (id) => api.get(`/agendamentos/${id}`).then((r) => r.data),

  // de/ate: objetos Date do JS — convertidos pra ISO 8601 (o formato que
  // DateTimeOffset do C# entende) antes de virar query string.
  FnlistarPorBarbeiroEPeriodo: (barbeiroId, de, ate) =>
    api
      .get(`/agendamentos/por-barbeiro/${barbeiroId}`, {
        params: { de: de.toISOString(), ate: ate.toISOString() },
      })
      .then((r) => r.data),

  FnlistarPorCliente: (clienteId) =>
    api.get(`/agendamentos/por-cliente/${clienteId}`).then((r) => r.data),

  // Não manda "fim" nem "precoCobrado" — o back calcula os dois a partir
  // do Servico (ver AgendamentoService.CriarAsync). Se o horário já
  // estiver ocupado, a Api responde 409 e o client.js já traduz a
  // mensagem certa (ver interceptor em client.js).
  Fncriar: (dados) => api.post('/agendamentos', dados).then((r) => r.data),

  // Fluxo do CLIENTE (Comum) pedindo um horário — nasce Pendente, e o
  // back valida se cabe no expediente cadastrado do barbeiro (ver
  // AgendamentoService.SolicitarAsync). Sem clienteId: o back resolve
  // pela conta logada.
  Fnsolicitar: (dados) => api.post('/agendamentos/solicitar', dados).then((r) => r.data),

  // "Meus agendamentos" — os do próprio usuário logado, qualquer status.
  FnlistarMeus: () => api.get('/agendamentos/meus').then((r) => r.data),

  // "Aba de solicitações" do staff — Pendentes de todos os barbeiros
  // (Admin) ou só os do próprio barbeiro logado (Barbeiro).
  FnlistarPendentes: () => api.get('/agendamentos/pendentes').then((r) => r.data),

  // "Fila de hoje" do próprio usuário logado — posição calculada na hora
  // (ver AgendamentoService.ListarMinhaFilaAsync), nunca guardada. Usado
  // em Layout.jsx (aviso "Você é o próximo da vez") e MeusAgendamentos.jsx
  // (mostrar a posição de cada horário confirmado de hoje).
  FnlistarMinhaFila: () => api.get('/agendamentos/minha-fila').then((r) => r.data),

  // 'mensagem' é sempre opcional (recado do Admin/Barbeiro pro cliente) —
  // vai como query string, então omitir o parâmetro não manda nada.
  Fnconfirmar: (id, mensagem) => api.post(`/agendamentos/${id}/confirmar`, null, { params: { mensagem } }),
  Fnrejeitar: (id, mensagem) => api.post(`/agendamentos/${id}/rejeitar`, null, { params: { mensagem } }),
  FniniciarAtendimento: (id) => api.post(`/agendamentos/${id}/iniciar-atendimento`),
  Fnconcluir: (id) => api.post(`/agendamentos/${id}/concluir`),
  Fncancelar: (id, mensagem) => api.post(`/agendamentos/${id}/cancelar`, null, { params: { mensagem } }),
  FnmarcarNaoCompareceu: (id, mensagem) =>
    api.post(`/agendamentos/${id}/nao-compareceu`, null, { params: { mensagem } }),
}
