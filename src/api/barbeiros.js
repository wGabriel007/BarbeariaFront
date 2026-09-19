import { api } from './client'

export const barbeirosApi = {
  Fnlistar: () => api.get('/barbeiros').then((r) => r.data),

  FnobterPorId: (id) => api.get(`/barbeiros/${id}`).then((r) => r.data),

  // usuarioId precisa ser de um Usuario Comum já existente — a Api
  // promove esse usuário a Barbeiro sozinha (muda o Tipo dele, desfaz o
  // vínculo de Cliente se houver um, e cria o cadastro de Barbeiro).
  Fnpromover: (dados) => api.post('/barbeiros', dados).then((r) => r.data),

  // diaSemana: "Domingo".."Sabado" | horaInicio/horaFim: "HH:mm:ss" ou "HH:mm"
  FnadicionarHorario: (id, dados) =>
    api.post(`/barbeiros/${id}/horarios`, dados).then((r) => r.data),

  FnremoverHorario: (id, horarioId) =>
    api.delete(`/barbeiros/${id}/horarios/${horarioId}`).then((r) => r.data),

  Fninativar: (id) => api.post(`/barbeiros/${id}/inativar`),

  Fnativar: (id) => api.post(`/barbeiros/${id}/ativar`),

  FndefinirAusencia: (id, ausente) => api.post(`/barbeiros/${id}/ausencia`, { ausente }),

  // Bio/Especialidade — apresentação profissional self-service exibida
  // em "Sobre a barbearia" (ver paginas/SobreABarbearia.jsx).
  FnatualizarPerfil: (id, dados) => api.put(`/barbeiros/${id}/perfil`, dados).then((r) => r.data),
}
