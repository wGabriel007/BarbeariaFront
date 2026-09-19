import { api } from './client'

export const usuariosApi = {
  Fnlistar: () => api.get('/usuarios').then((r) => r.data),

  // tipo: "Admin" | "Barbeiro" — a Api serializa/aceita o enum como texto
  // (ver JsonStringEnumConverter em Program.cs).
  Fncriar: (dados) => api.post('/usuarios', dados).then((r) => r.data),
}
