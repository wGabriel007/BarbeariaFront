import { useState } from 'react'
import { barbeirosApi } from '../api/barbeiros'
import { usuariosApi } from '../api/usuarios'
import { clientesApi } from '../api/clientes'
import { useAuth } from '../contexto/AuthContext'
import { useAsync } from '../ganchos/useAsync'
import { useToastErro } from '../ganchos/useToastErro'
import { FnButton } from '../componentes/ui/Button'
import { FnField, FnInput, FnSelect } from '../componentes/ui/Field'
import { FnBadge } from '../componentes/ui/Badge'
import { FnAvatar } from '../componentes/ui/Avatar'
import { FnModal } from '../componentes/ui/Modal'
import { FnPageHeader } from '../componentes/ui/PageHeader'
import { FnEmptyState, FnErrorAlert, FnSpinner } from '../componentes/ui/Feedback'
import { FnToast } from '../componentes/ui/Toast'
import { FnIconX } from '../componentes/ui/Icons'

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']

const BARBEIRO_VAZIO = { usuarioId: '', telefone: '' }
const HORARIO_VAZIO = { diaSemana: 'Segunda', horaInicio: '09:00', horaFim: '18:00' }

export function FnBarbeiros() {
  // Só Admin/Barbeiro gerenciam barbeiros — BarbeirosController e
  // UsuariosController já recusam essas ações/consulta pra um Comum.
  const { ehStaff, usuario } = useAuth()

  const { dados: barbeiros, carregando, erro, Fnrecarregar } = useAsync(
    () => barbeirosApi.Fnlistar(),
    [],
  )
  // Só pra popular o <select> de usuários na hora de Fnpromover alguém a
  // barbeiro — não existe mais "criar barbeiro do zero", o Admin escolhe
  // um usuário Comum já cadastrado (ver BarbeiroService.PromoverAsync).
  // Nem chama a Api se for Comum (que nem acessa /api/usuarios — ver
  // UsuariosController).
  const { dados: usuarios } = useAsync(
    () => (ehStaff ? usuariosApi.Fnlistar() : Promise.resolve([])),
    [ehStaff],
  )
  // Só pra saber, no rótulo do <select>, quais desses usuários Comum já
  // são Cliente (pra deixar claro pro Admin que promovê-los desfaz esse
  // vínculo — ver aviso no formulário).
  const { dados: clientes } = useAsync(
    () => (ehStaff ? clientesApi.Fnlistar() : Promise.resolve([])),
    [ehStaff],
  )

  const [modalCriarAberto, setModalCriarAberto] = useState(false)
  const [form, setForm] = useState(BARBEIRO_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState(null)

  const [barbeiroDeHorario, setBarbeiroDeHorario] = useState(null) // barbeiro selecionado pro modal de horário
  const [horario, setHorario] = useState(HORARIO_VAZIO)
  const [erroHorario, setErroHorario] = useState(null)
  const { erro: erroAcao, FnmostrarErro, FnfecharErro } = useToastErro()

  // Candidatos a barbeiro: qualquer usuário Comum, cliente ou não (ver
  // pedido do Gabriel) — quem já é Barbeiro ou Admin não aparece mais
  // aqui (o próprio Tipo já mudou depois de promovido).
  const usuariosComuns = (usuarios ?? []).filter((u) => u.tipo === 'Comum')
  const idsDeClientes = new Set((clientes ?? []).map((c) => c.usuarioId).filter(Boolean))

  function FnabrirParaCriar() {
    setForm(BARBEIRO_VAZIO)
    setErroForm(null)
    setModalCriarAberto(true)
  }

  async function Fnsalvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErroForm(null)

    try {
      await barbeirosApi.Fnpromover({
        usuarioId: Number(form.usuarioId),
        telefone: form.telefone || null,
      })
      setModalCriarAberto(false)
      Fnrecarregar()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function FnsalvarHorario(e) {
    e.preventDefault()
    setErroHorario(null)

    try {
      // TimeOnly do C# espera "HH:mm:ss" — o <input type="time"> só dá
      // "HH:mm", então completamos com ":00".
      await barbeirosApi.FnadicionarHorario(barbeiroDeHorario.id, {
        diaSemana: horario.diaSemana,
        horaInicio: `${horario.horaInicio}:00`,
        horaFim: `${horario.horaFim}:00`,
      })
      setBarbeiroDeHorario(null)
      Fnrecarregar()
    } catch (err) {
      setErroHorario(err.message)
    }
  }

  async function FnmudarStatus(barbeiro, Fnacao) {
    try {
      await barbeirosApi[Fnacao](barbeiro.id)
      Fnrecarregar()
    } catch (err) {
      FnmostrarErro(err.message)
    }
  }

  async function FnalternarAusencia(barbeiro) {
    try {
      await barbeirosApi.FndefinirAusencia(barbeiro.id, !barbeiro.ausente)
      Fnrecarregar()
    } catch (err) {
      FnmostrarErro(err.message)
    }
  }

  async function FnremoverHorario(barbeiro, horario) {
    try {
      await barbeirosApi.FnremoverHorario(barbeiro.id, horario.id)
      Fnrecarregar()
    } catch (err) {
      FnmostrarErro(err.message)
    }
  }

  return (
    <div>
      <FnPageHeader
        titulo="Barbeiros"
        descricao="Cadastro de barbeiros e seus horários de trabalho."
        Fnacao={ehStaff ? <FnButton onClick={FnabrirParaCriar}>+ Novo barbeiro</FnButton> : null}
      />

      {carregando && <FnSpinner />}
      <FnErrorAlert erro={erro} />

      {barbeiros && barbeiros.length === 0 && (
        <FnEmptyState>
          {ehStaff
            ? 'Nenhum barbeiro cadastrado ainda. Clique em "+ Novo barbeiro" para promover um usuário Comum.'
            : 'Nenhum barbeiro disponível no dia de hoje.'}
        </FnEmptyState>
      )}

      {barbeiros && barbeiros.length > 0 && (
        <div className="space-y-3">
          {barbeiros.map((barbeiro) => {
            // Self-service: o próprio barbeiro (não Admin) só liga/desliga
            // a PRÓPRIA ausência — um Admin pode ajustar a de qualquer um.
            const podeAlterarAusencia =
              usuario?.tipo === 'Admin' || (ehStaff && barbeiro.usuarioId === usuario?.id)

            return (
            <div
              key={barbeiro.id}
              className="rounded-xl border border-brand-200 bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FnAvatar nome={barbeiro.nomeCompleto} fotoUrl={barbeiro.fotoUrl} />
                  <div>
                    <div className="font-medium text-brand-900">
                      {barbeiro.nomeCompleto} {barbeiro.telefone && `· ${barbeiro.telefone}`}
                    </div>
                    {/* Rótulo curto que o próprio barbeiro escreve sobre si
                        (ver paginas/SobreABarbearia.jsx) — só aparece se ele
                        preencheu, senão o card fica igual sempre foi. */}
                    {barbeiro.especialidade && (
                      <div className="mt-0.5 text-xs text-brand-500">{barbeiro.especialidade}</div>
                    )}
                    <div className="mt-1 flex gap-1">
                      <FnBadge status={barbeiro.status} />
                      {barbeiro.ausente && <FnBadge status="Ausente" />}
                    </div>
                  </div>
                </div>
                {ehStaff && (
                  <div className="flex gap-2">
                    <FnButton variant="ghost" onClick={() => setBarbeiroDeHorario(barbeiro)}>
                      + Horário
                    </FnButton>
                    {podeAlterarAusencia && (
                      <FnButton variant="ghost" onClick={() => FnalternarAusencia(barbeiro)}>
                        {barbeiro.ausente ? 'Marcar presente' : 'Marcar ausente'}
                      </FnButton>
                    )}
                    {barbeiro.status === 'Ativo' ? (
                      <FnButton variant="ghost" onClick={() => FnmudarStatus(barbeiro, 'Fninativar')}>
                        Inativar
                      </FnButton>
                    ) : (
                      <FnButton variant="ghost" onClick={() => FnmudarStatus(barbeiro, 'Fnativar')}>
                        Ativar
                      </FnButton>
                    )}
                  </div>
                )}
              </div>

              {barbeiro.horarios.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {barbeiro.horarios.map((h) => (
                    <span
                      key={h.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 py-1 pl-3 pr-1 text-xs text-brand-700"
                    >
                      {h.diaSemana} · {h.horaInicio.slice(0, 5)}–{h.horaFim.slice(0, 5)}
                      {ehStaff && (
                        <button
                          type="button"
                          onClick={() => FnremoverHorario(barbeiro, h)}
                          className="rounded-full p-0.5 text-brand-500 transition-colors hover:bg-brand-200 hover:text-brand-900"
                          aria-label="Remover este horário"
                          title="Remover horário"
                        >
                          <FnIconX className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
            )
          })}
        </div>
      )}

      <FnModal titulo="Novo barbeiro" aberto={modalCriarAberto} onFechar={() => setModalCriarAberto(false)}>
        <form onSubmit={Fnsalvar} className="space-y-4">
          <FnField label="Usuário (Comum)" hint="Se ele já for Cliente, esse vínculo é desfeito ao promover.">
            <FnSelect
              required
              value={form.usuarioId}
              onChange={(e) => setForm({ ...form, usuarioId: e.target.value })}
            >
              <option value="">Selecione...</option>
              {usuariosComuns.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nomeCompleto} ({u.email}){idsDeClientes.has(u.id) ? ' · já é cliente' : ''}
                </option>
              ))}
            </FnSelect>
          </FnField>

          <FnField label="Telefone (opcional)">
            <FnInput
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            />
          </FnField>

          <FnErrorAlert erro={erroForm ? { message: erroForm } : null} />

          <div className="flex justify-end gap-2 pt-2">
            <FnButton type="button" variant="secondary" onClick={() => setModalCriarAberto(false)}>
              Cancelar
            </FnButton>
            <FnButton type="submit" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </FnButton>
          </div>
        </form>
      </FnModal>

      <FnModal
        titulo={`Novo horário — ${barbeiroDeHorario?.nomeCompleto ?? ''}`}
        aberto={!!barbeiroDeHorario}
        onFechar={() => setBarbeiroDeHorario(null)}
      >
        <form onSubmit={FnsalvarHorario} className="space-y-4">
          <FnField label="Dia da semana">
            <FnSelect
              value={horario.diaSemana}
              onChange={(e) => setHorario({ ...horario, diaSemana: e.target.value })}
            >
              {DIAS_SEMANA.map((dia) => (
                <option key={dia} value={dia}>
                  {dia}
                </option>
              ))}
            </FnSelect>
          </FnField>

          <div className="grid grid-cols-2 gap-4">
            <FnField label="Início">
              <FnInput
                type="time"
                value={horario.horaInicio}
                onChange={(e) => setHorario({ ...horario, horaInicio: e.target.value })}
              />
            </FnField>
            <FnField label="Fim">
              <FnInput
                type="time"
                value={horario.horaFim}
                onChange={(e) => setHorario({ ...horario, horaFim: e.target.value })}
              />
            </FnField>
          </div>

          <FnErrorAlert erro={erroHorario ? { message: erroHorario } : null} />

          <div className="flex justify-end gap-2 pt-2">
            <FnButton type="button" variant="secondary" onClick={() => setBarbeiroDeHorario(null)}>
              Cancelar
            </FnButton>
            <FnButton type="submit">Adicionar</FnButton>
          </div>
        </form>
      </FnModal>

      <FnToast aberto={!!erroAcao} mensagem={erroAcao ?? ''} tipo="erro" onFechar={FnfecharErro} />
    </div>
  )
}
