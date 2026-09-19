// Guarda, por usuário (localStorage é por navegador, mas mais de uma
// conta pode logar no mesmo navegador — por isso a Fnchave inclui o id) E
// por "escopo" (uma aba diferente pode ter sua própria ideia de "visto"
// — ver Layout.jsx), a última vez que a pessoa efetivamente abriu
// aquela aba. A bolinha vermelha em Layout.jsx compara isso contra o
// atualizadoEm de cada registro (agendamento, solicitação de plano,
// assinatura — todos AuditableEntity, ver comentário nos DTOs no back)
// pra saber se algo mudou desde então.
//
// Não existe uma tabela de "notificações" no banco de propósito — igual
// o FnRanking e o EhCliente, é mais simples e sempre correto recalcular na
// hora a partir do que já existe (atualizado_em já é preenchido pelo
// próprio banco em todo UPDATE) do que manter um contador duplicado que
// pode dessincronizar.
function Fnchave(usuarioId, escopo) {
  return `barbearia:notificacoes:${escopo}:${usuarioId}`
}

export function FnobterUltimaVisualizacao(usuarioId, escopo) {
  try {
    const salvo = localStorage.getItem(Fnchave(usuarioId, escopo))
    return salvo ? new Date(salvo) : new Date(0)
  } catch {
    // localStorage pode falhar (modo privado, storage cheio, etc.) —
    // nesse caso tratamos como "nunca visto", o que só faz a bolinha
    // aparecer à toa, nunca quebra a navegação.
    return new Date(0)
  }
}

export function FnmarcarComoVisto(usuarioId, escopo) {
  try {
    localStorage.setItem(Fnchave(usuarioId, escopo), new Date().toISOString())
  } catch {
    // Ver comentário acima — silencioso de propósito.
  }
}

// "Você é o próximo da vez": diferente das bolinhas acima (que só
// contam "quantos itens novos"), este aviso é um evento — dispara UMA
// vez quando o cliente vira o Nº 1 da fila (ver
// AgendamentoService.ListarMinhaFilaAsync), não a cada nova checagem de
// 25 em 25s enquanto ele continuar sendo o próximo. Por isso guarda,
// por agendamento (o id já é único no sistema todo, não precisa
// misturar com usuarioId), se aquele aviso específico já foi mostrado.
function FnchaveProximoAvisado(agendamentoId) {
  return `barbearia:notificacoes:proximo-avisado:${agendamentoId}`
}

export function FnjaAvisouProximoDaVez(agendamentoId) {
  try {
    return localStorage.getItem(FnchaveProximoAvisado(agendamentoId)) === '1'
  } catch {
    return false
  }
}

export function FnmarcarProximoDaVezAvisado(agendamentoId) {
  try {
    localStorage.setItem(FnchaveProximoAvisado(agendamentoId), '1')
  } catch {
    // Silencioso de propósito — na pior das hipóteses o aviso repete.
  }
}
