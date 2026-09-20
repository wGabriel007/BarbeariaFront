import { api } from './client'

// Ambas as rotas são [AllowAnonymous] na Api (ver AuthController.cs) —
// fazem sentido sem token, porque é justamente pra CONSEGUIR um token.
// As duas devolvem o mesmo formato: { token, usuario }.
export const authApi = {
  Fnlogin: (email, senha) => api.post('/auth/login', { email, senha }).then((r) => r.data),

  // Sem "tipo" no corpo de propósito: quem se cadastra pela tela pública
  // sempre nasce como usuário Comum — só a primeira conta do sistema
  // vira Admin automaticamente (decidido no servidor, ver
  // AutenticacaoService.RegistrarAsync na Api). Contas de barbeiro ou
  // outros admins são criadas depois, já logado, na tela de Usuários
  // (ver src/paginas/Usuarios.jsx).
  Fnregistrar: (dados) => api.post('/auth/registrar', dados).then((r) => r.data),

  // Login do SuperAdmin (dono da plataforma) — rota à parte, sem
  // X-Empresa-Slug, já que ele não pertence a nenhuma barbearia (ver
  // AuthController.cs / EmpresasController.cs na Api).
  FnloginAdmin: (email, senha) => api.post('/auth/login-admin', { email, senha }).then((r) => r.data),
}
