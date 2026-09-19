import { useState } from 'react'
import { clientesApi } from '../api/clientes'
import { usuariosApi } from '../api/usuarios'
import { useAuth } from '../contexto/AuthContext'
import { useAsync } from '../ganchos/useAsync'
import { useToastErro } from '../ganchos/useToastErro'
import { FnButton } from '../componentes/ui/Button'
import { FnCampoBusca, FnField, FnInput, FnSelect, FnTextarea } from '../componentes/ui/Field'
import { FnBadge } from '../componentes/ui/Badge'
import { FnModal } from '../componentes/ui/Modal'
import { FnPageHeader } from '../componentes/ui/PageHeader'
import { FnEmptyState, FnErrorAlert, FnSpinner } from '../componentes/ui/Feedback'
import { FnToast } from '../componentes/ui/Toast'
import { FnCorresponde } from '../utilitarios/busca'

const CLIENTE_VAZIO = {
  nomeCompleto: '',
  telefone: '',
  email: '',
  observacoes: '',
}

export function FnClientes() {
  // Só Admin/Barbeiro gerenciam clientes — o backend já recusa essas
  // ações pra um usuário Comum (ClientesController), isso aqui só evita
  // mostrar um botão que ia dar 403.
  const { ehStaff } = useAuth()

  // useAsync (ver src/ganchos/useAsync.js) já cuida de carregando/erro/dados
  // — a página só precisa dizer QUAL chamada fazer.
  const { dados: clientes, carregando, erro, Fnrecarregar } = useAsync(
    () => clientesApi.Fnlistar(),
    [],
  )
  // Só pra popular o <select> de usuários na hora de vincular um cliente —
  // não existe mais "criar cliente do zero", o Admin escolhe um usuário
  // Comum já cadastrado (ver ClienteService.PromoverAsync).
  const { dados: usuarios } = useAsync(
    () => (ehStaff ? usuariosApi.Fnlistar() : Promise.resolve([])),
    [ehStaff],
  )

  const [modalPromoverAberto, setModalPromoverAberto] = useState(false)
  const [usuarioIdPromover, setUsuarioIdPromover] = useState('')
  const [promovendo, setPromovendo] = useState(false)
  const [erroPromover, setErroPromover] = useState(null)

  const [modalAberto, setModalAberto] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)
  const [form, setForm] = useState(CLIENTE_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState(null)
  const { erro: erroAcao, FnmostrarErro, FnfecharErro } = useToastErro()

  // Filtro por nome/telefone/e-mail, só no que já está carregado (a
  // lista de clientes de uma barbearia nunca é grande o bastante pra
  // precisar de busca no back) — ver utilitarios/busca.js.
  const [busca, setBusca] = useState('')
  const clientesFiltrados = (clientes ?? []).filter(
    (c) => FnCorresponde(c.nomeCompleto, busca) || FnCorresponde(c.telefone, busca) || FnCorresponde(c.email, busca),
  )

  // Usuários Comum que ainda não são cliente de ninguém — os únicos que
  // dá pra vincular aqui (quem já tem, o próprio back rejeitaria).
  const idsClientesExistentes = new Set((clientes ?? []).map((c) => c.usuarioId).filter(Boolean))
  const usuariosDisponiveis = (usuarios ?? []).filter(
    (u) => u.tipo === 'Comum' && !idsClientesExistentes.has(u.id),
  )

  function FnabrirParaPromover() {
    setUsuarioIdPromover('')
    setErroPromover(null)
    setModalPromoverAberto(true)
  }

  async function Fnpromover(e) {
    e.preventDefault()
    setPromovendo(true)
    setErroPromover(null)

    try {
      await clientesApi.Fnpromover(Number(usuarioIdPromover))
      setModalPromoverAberto(false)
      Fnrecarregar()
    } catch (err) {
      setErroPromover(err.message)
    } finally {
      setPromovendo(false)
    }
  }

  function FnabrirParaEditar(cliente) {
    setClienteEditando(cliente)
    setForm({
      nomeCompleto: cliente.nomeCompleto,
      // Um cliente sempre nasce ligado a um usuário agora (auto-provisionado
      // no primeiro agendamento, ou promovido manualmente aqui) e pode não
      // ter telefone nenhum ainda — '' em vez de null/undefined evita virar
      // um input não controlado ao editar.
      telefone: cliente.telefone ?? '',
      email: cliente.email ?? '',
      observacoes: cliente.observacoes ?? '',
    })
    setErroForm(null)
    setModalAberto(true)
  }

  async function Fnsalvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErroForm(null)

    try {
      await clientesApi.Fnatualizar(clienteEditando.id, {
        nomeCompleto: form.nomeCompleto,
        telefone: form.telefone,
        email: form.email || null,
        observacoes: form.observacoes || null,
      })
      setModalAberto(false)
      Fnrecarregar()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function FnmudarStatus(cliente, Fnacao) {
    try {
      await clientesApi[Fnacao](cliente.id)
      Fnrecarregar()
    } catch (err) {
      FnmostrarErro(err.message)
    }
  }

  return (
    <div>
      <FnPageHeader
        titulo="Clientes"
        descricao="Cadastro de clientes da barbearia."
        Fnacao={ehStaff ? <FnButton onClick={FnabrirParaPromover}>+ Novo cliente</FnButton> : null}
      />

      {carregando && <FnSpinner />}
      <FnErrorAlert erro={erro} />

      {clientes && clientes.length > 0 && (
        <div className="mb-4 max-w-sm">
          <FnCampoBusca value={busca} onChange={setBusca} placeholder="Buscar por nome, telefone ou e-mail..." />
        </div>
      )}

      {clientes && clientes.length === 0 && (
        <FnEmptyState>Nenhum cliente cadastrado ainda. Clique em "Novo cliente" para vincular um usuário Comum.</FnEmptyState>
      )}

      {clientes && clientes.length > 0 && clientesFiltrados.length === 0 && (
        <FnEmptyState>Nenhum cliente encontrado para "{busca}".</FnEmptyState>
      )}

      {clientesFiltrados.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-brand-200 bg-surface">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-100 text-brand-700">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {ehStaff && <th className="px-4 py-3 font-medium">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id} className="transition-colors hover:bg-brand-50">
                  <td className="px-4 py-3 font-medium text-brand-900">{cliente.nomeCompleto}</td>
                  <td className="px-4 py-3 text-brand-600">{cliente.telefone ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-600">{cliente.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <FnBadge status={cliente.status} />
                  </td>
                  {ehStaff && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <FnButton variant="ghost" onClick={() => FnabrirParaEditar(cliente)}>
                          Editar
                        </FnButton>
                        {cliente.status === 'Ativo' ? (
                          <>
                            <FnButton variant="ghost" onClick={() => FnmudarStatus(cliente, 'Fninativar')}>
                              Inativar
                            </FnButton>
                            <FnButton variant="ghost" onClick={() => FnmudarStatus(cliente, 'Fnbloquear')}>
                              Bloquear
                            </FnButton>
                          </>
                        ) : (
                          <FnButton variant="ghost" onClick={() => FnmudarStatus(cliente, 'Fnativar')}>
                            Ativar
                          </FnButton>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <FnModal titulo="Novo cliente" aberto={modalPromoverAberto} onFechar={() => setModalPromoverAberto(false)}>
        <form onSubmit={Fnpromover} className="space-y-4">
          <FnField label="Usuário (Comum)" hint="Nome e e-mail vêm da própria conta — telefone e demais dados você completa depois, em Editar.">
            <FnSelect
              required
              value={usuarioIdPromover}
              onChange={(e) => setUsuarioIdPromover(e.target.value)}
            >
              <option value="">Selecione...</option>
              {usuariosDisponiveis.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nomeCompleto} ({u.email})
                </option>
              ))}
            </FnSelect>
          </FnField>

          <FnErrorAlert erro={erroPromover ? { message: erroPromover } : null} />

          <div className="flex justify-end gap-2 pt-2">
            <FnButton type="button" variant="secondary" onClick={() => setModalPromoverAberto(false)}>
              Cancelar
            </FnButton>
            <FnButton type="submit" disabled={promovendo}>
              {promovendo ? 'Salvando...' : 'Salvar'}
            </FnButton>
          </div>
        </form>
      </FnModal>

      <FnModal titulo="Editar cliente" aberto={modalAberto} onFechar={() => setModalAberto(false)}>
        <form onSubmit={Fnsalvar} className="space-y-4">
          <FnField label="Nome completo">
            <FnInput
              required
              value={form.nomeCompleto}
              onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
            />
          </FnField>

          <FnField label="Telefone">
            <FnInput
              placeholder="11999990000"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            />
          </FnField>

          <FnField label="E-mail (opcional)">
            <FnInput
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </FnField>

          <FnField label="Observações (opcional)">
            <FnTextarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </FnField>

          <FnErrorAlert erro={erroForm ? { message: erroForm } : null} />

          <div className="flex justify-end gap-2 pt-2">
            <FnButton type="button" variant="secondary" onClick={() => setModalAberto(false)}>
              Cancelar
            </FnButton>
            <FnButton type="submit" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </FnButton>
          </div>
        </form>
      </FnModal>

      <FnToast aberto={!!erroAcao} mensagem={erroAcao ?? ''} tipo="erro" onFechar={FnfecharErro} />
    </div>
  )
}
