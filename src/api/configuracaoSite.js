import { api } from './client'

// GET é público (a tela de FnLogin também usa, pra já mostrar a marca certa
// da barbearia antes mesmo de entrar — ver ConfiguracaoSiteContext); os
// outros três exigem Admin (a Api já recusa o resto, ver
// ConfiguracaoSiteController).
export const configuracaoSiteApi = {
  Fnobter: () => api.get('/configuracao-site').then((r) => r.data),

  Fnatualizar: (dados) => api.put('/configuracao-site', dados).then((r) => r.data),

  FnenviarLogo: (arquivo) => {
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    // Ver comentário igual em perfil.js: sem Content-Type fixo aqui, pro
    // navegador calcular sozinho o boundary do multipart/form-data.
    return api
      .post('/configuracao-site/logo', formData, { headers: { 'Content-Type': undefined } })
      .then((r) => r.data)
  },

  FnremoverLogo: () => api.delete('/configuracao-site/logo').then((r) => r.data),

  // Diferente dos quatro acima (só Admin): estes três exigem só
  // Admin OU Barbeiro — ver aba "Sobre a barbearia"
  // (paginas/SobreABarbearia.jsx) e o comentário equivalente em
  // ConfiguracaoSiteController na Api.
  FnatualizarInformacoes: (dados) => api.put('/configuracao-site/informacoes', dados).then((r) => r.data),

  FnadicionarFoto: (arquivo) => {
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    return api
      .post('/configuracao-site/fotos', formData, { headers: { 'Content-Type': undefined } })
      .then((r) => r.data)
  },

  FnremoverFoto: (fotoId) => api.delete(`/configuracao-site/fotos/${fotoId}`).then((r) => r.data),
}
