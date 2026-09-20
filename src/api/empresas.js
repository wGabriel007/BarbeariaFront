import { api } from './client'

// Gestão das barbearias cadastradas na plataforma — só o SuperAdmin
// acessa (ver EmpresasController.cs, [Authorize(Roles = "SuperAdmin")]
// na Api). Usado só por paginas/AdminDashboard.jsx.
export const empresasApi = {
  Fnlistar: () => api.get('/empresas').then((r) => r.data),

  Fncriar: (dados) => api.post('/empresas', dados).then((r) => r.data),

  Fnativar: (id) => api.post(`/empresas/${id}/ativar`).then((r) => r.data),

  Fninativar: (id) => api.post(`/empresas/${id}/inativar`).then((r) => r.data),
}
