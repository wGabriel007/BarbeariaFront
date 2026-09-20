import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { FnsetAuthToken, FnsetUnauthorizedHandler } from '../api/client'

const CHAVE_TOKEN = 'barbearia:token'
const CHAVE_USUARIO = 'barbearia:usuario'

const AuthContext = createContext(null)

function FnlerSessaoSalva() {
  try {
    const token = localStorage.getItem(CHAVE_TOKEN)
    const usuarioJson = localStorage.getItem(CHAVE_USUARIO)
    if (!token || !usuarioJson) return null
    return { token, usuario: JSON.parse(usuarioJson) }
  } catch {
    // localStorage pode não estar disponível (aba anônima com bloqueio
    // de terceiros, por exemplo) — nesse caso, simplesmente começa sem
    // sessão salva, em vez de quebrar a página inteira.
    return null
  }
}

/**
 * Guarda quem está logado (token + dados do usuário) e expõe
 * Fnlogin/Fnregistrar/Fnlogout pra qualquer componente, via useAuth().
 *
 * Fica ACIMA do <Routes> em App.jsx, dentro do <BrowserRouter> (ver
 * main.jsx) — precisa estar dentro do Router porque usa useNavigate()
 * pra mandar a pessoa de volta pro /login ao deslogar.
 */
export function FnAuthProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [sessao, setSessao] = useState(() => FnlerSessaoSalva())

  // Mantém client.js (o axios) sincronizado com o token atual — tanto
  // no Fnlogin/Fnlogout quanto no valor que já estava salvo ao abrir a
  // página (o useState acima já roda FnlerSessaoSalva() antes deste
  // efeito, então a primeira requisição da aplicação já sai com o
  // header certo).
  useEffect(() => {
    FnsetAuthToken(sessao?.token ?? null)
  }, [sessao])

  const Fnlogout = useCallback(() => {
    setSessao(null)
    try {
      localStorage.removeItem(CHAVE_TOKEN)
      localStorage.removeItem(CHAVE_USUARIO)
    } catch {
      // Se não der pra limpar o localStorage, não é motivo pra travar o
      // Fnlogout — o estado em memória (sessao=null) já foi limpo.
    }
    // Multi-barbearia: não existe mais um "/login" único — cada barbearia
    // tem o seu, em "/:slug/login" (ver App.jsx), e o SuperAdmin tem o
    // dele à parte, em "/admin/login". Em vez de precisar saber o slug de
    // outro jeito (este Provider fica ACIMA das rotas, sem useParams()),
    // lê o primeiro pedaço da URL atual direto: é exatamente o slug (ou
    // "admin") de onde a pessoa estava quando foi deslogada — inclusive
    // no caso mais comum de Fnlogout, um 401 vindo de QUALQUER tela (ver
    // FnsetUnauthorizedHandler abaixo).
    const segmento = location.pathname.split('/').filter(Boolean)[0]
    if (segmento === 'admin') navigate('/admin/login')
    else if (segmento) navigate(`/${segmento}/login`)
    else navigate('/') // sem slug nenhum pra voltar (ex.: já estava na landing) — não existe "/login" solto pra ir
  }, [navigate, location.pathname])

  // client.js chama isso sozinho quando QUALQUER requisição volta 401
  // (token ausente/expirado/inválido). Sem essa ponte, a pessoa ficaria
  // "logada" na tela, mas toda ação silenciosamente falhando.
  useEffect(() => {
    FnsetUnauthorizedHandler(Fnlogout)
  }, [Fnlogout])

  const FnsalvarSessao = useCallback(({ token, usuario }) => {
    setSessao({ token, usuario })
    try {
      localStorage.setItem(CHAVE_TOKEN, token)
      localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario))
    } catch {
      // Sessão continua funcionando, só que apenas em memória pra esta
      // aba (some se Fnrecarregar a página).
    }
  }, [])

  // Chamado pela aba "Meu perfil" depois de editar nome/telefone/foto —
  // atualiza a sessão em memória E o localStorage, sem precisar de um
  // novo Fnlogin, pra sidebar (nome, avatar) refletir a mudança na hora.
  const FnatualizarUsuario = useCallback((dadosParciais) => {
    setSessao((atual) => {
      if (!atual) return atual

      const usuarioAtualizado = { ...atual.usuario, ...dadosParciais }
      try {
        localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuarioAtualizado))
      } catch {
        // Idem outros catches deste arquivo: sem localStorage, a sessão
        // atualizada só vale em memória pra esta aba.
      }
      return { ...atual, usuario: usuarioAtualizado }
    })
  }, [])

  const Fnlogin = useCallback(
    async (email, senha) => FnsalvarSessao(await authApi.Fnlogin(email, senha)),
    [FnsalvarSessao],
  )

  const Fnregistrar = useCallback(
    async (dados) => FnsalvarSessao(await authApi.Fnregistrar(dados)),
    [FnsalvarSessao],
  )

  // Login do SuperAdmin (dono da plataforma — ver paginas/AdminLogin.jsx),
  // separado de Fnlogin porque bate em POST /auth/login-admin, não
  // /auth/login (ver AuthController na Api) — não passa pelo header
  // X-Empresa-Slug, porque o SuperAdmin não pertence a barbearia nenhuma.
  const FnloginAdmin = useCallback(
    async (email, senha) => FnsalvarSessao(await authApi.FnloginAdmin(email, senha)),
    [FnsalvarSessao],
  )

  const value = useMemo(() => {
    const tipo = sessao?.usuario?.tipo
    return {
      usuario: sessao?.usuario ?? null,
      autenticado: !!sessao,
      // "Staff" = Admin ou Barbeiro: os dois têm o mesmo nível de acesso
      // de gestão (Fncriar/Fninativar/Fnbloquear, Fncriar assinatura, Fncriar
      // barbeiro, etc.). Um usuário Comum só marca/cancela o próprio
      // horário — o backend já barra o resto (ver os Controllers com
      // [Authorize(Roles = "Admin,Barbeiro")]), isso aqui é só pra não
      // nem mostrar botão de uma ação que ele não pode fazer.
      ehStaff: tipo === 'Admin' || tipo === 'Barbeiro',
      ehSuperAdmin: tipo === 'SuperAdmin',
      Fnlogin,
      Fnregistrar,
      FnloginAdmin,
      Fnlogout,
      FnatualizarUsuario,
    }
  }, [sessao, Fnlogin, Fnregistrar, FnloginAdmin, Fnlogout, FnatualizarUsuario])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de <AuthProvider>.')
  }
  return context
}
