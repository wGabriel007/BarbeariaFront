// FnBadge de status — mapeia o enum StatusRegistro (Ativo/Inativo/Bloqueado)
// e os enums de Agendamento/Assinatura pra uma cor consistente. Como o
// back manda o enum como TEXTO (ver JsonStringEnumConverter em
// Program.cs), a Fnchave aqui é exatamente a string que chega da Api.
const CORES = {
  Ativo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Ativa: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Confirmado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Concluido: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Inativo: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  Agendado: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  EmAtendimento: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  Suspensa: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  Bloqueado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  Cancelado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  Cancelada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  Expirada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  NaoCompareceu: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  Rejeitado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  Pendente: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  Pago: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Reembolsado: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  Ausente: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  Aceita: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Rejeitada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

export function FnBadge({ status }) {
  const cor = CORES[status] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cor}`}>
      {status}
    </span>
  )
}
