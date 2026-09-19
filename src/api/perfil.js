import { api } from './client'

// Aba "Meu perfil" — self-service (ver PerfilController na Api): sempre
// os dados de QUEM ESTÁ LOGADO, nunca de um id escolhido aqui no front.
export const perfilApi = {
  Fnobter: () => api.get('/perfil').then((r) => r.data),

  Fnatualizar: (dados) => api.put('/perfil', dados).then((r) => r.data),

  FnalterarSenha: (senhaAtual, novaSenha) => api.post('/perfil/senha', { senhaAtual, novaSenha }),

  FnenviarFoto: (arquivo) => {
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    // 'Content-Type': undefined remove o application/json que o client.js
    // define por padrão — o navegador precisa calcular sozinho o
    // boundary do multipart/form-data; se a gente fixar qualquer
    // Content-Type na mão, a Api não consegue separar os campos do upload.
    return api.post('/perfil/foto', formData, { headers: { 'Content-Type': undefined } }).then((r) => r.data)
  },

  FnremoverFoto: () => api.delete('/perfil/foto').then((r) => r.data),
}
