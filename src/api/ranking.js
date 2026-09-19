import { api } from './client'

// FnRanking de Cortes — GET é liberado pra qualquer usuário logado
// (inclusive Comum, é o público que o ranking quer incentivar); só
// "definirPremios" exige Admin/Barbeiro (a Api já recusa o resto, ver
// RankingController).
export const rankingApi = {
  Fnobter: (mes, ano) => {
    const params = {}
    if (mes) params.mes = mes
    if (ano) params.ano = ano
    return api.get('/ranking', { params }).then((r) => r.data)
  },

  Fnhistorico: (meses = 12) => api.get('/ranking/historico', { params: { meses } }).then((r) => r.data),

  FndefinirPremios: (premios) => api.put('/ranking/premios', { premios }).then((r) => r.data),
}
