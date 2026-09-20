import axios from 'axios'

// Uma única instância do axios, configurada uma vez, reaproveitada por
// todos os arquivos em src/api/*. Se um dia a Api mudar de porta, ou
// precisar de um header de autenticação em todo request, é AQUI que
// muda — nenhuma tela precisa saber disso.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5042/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Fotos de usuário e logo da barbearia (ver perfil.js/configuracaoSite.js)
// vêm da Api como URL RELATIVA (ex.: "/uploads/fotos-usuarios/xxx.jpg") —
// completamos aqui com a ORIGEM da própria Api (sem o "/api" do final,
// que é só o prefixo das rotas de dado, não dos arquivos estáticos).
// Uma função só, reaproveitada em toda tela que precisa mostrar uma
// dessas imagens, em vez de cada uma remontar essa conta sozinha.
export function FnurlArquivo(caminhoRelativo) {
  if (!caminhoRelativo) return null
  const origem = api.defaults.baseURL.replace(/\/api\/?$/, '')
  return `${origem}${caminhoRelativo}`
}

// Guardado em variável de módulo (não em localStorage direto aqui) pra
// não precisar ler o localStorage em TODA requisição — o AuthContext
// (src/contexto/AuthContext.jsx) chama FnsetAuthToken() uma vez no Fnlogin,
// no Fnlogout, e ao carregar a página (lendo o que já estava salvo).
let token = null

export function FnsetAuthToken(novoToken) {
  token = novoToken
}

// "Apelido" (slug) da barbearia atual, tirado da URL (ex.: /barbearia-do-joao/...
// -> "barbearia-do-joao" — ver ConfiguracaoSiteContext.jsx, que é quem
// chama isso, sempre que a rota muda). É o que a Api usa pra saber QUAL
// barbearia responder numa requisição ainda sem token (login, cadastro,
// leitura pública da configuração do site — ver EmpresaResolverMiddleware
// na Api). Requisição JÁ autenticada ignora este header por segurança (o
// EmpresaId vem de dentro do próprio token nesse caso) — por isso não tem
// problema mandar sempre que existir, mesmo já logado.
let empresaSlug = null

export function FnsetEmpresaSlug(novoSlug) {
  empresaSlug = novoSlug
}

api.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (empresaSlug) {
    config.headers['X-Empresa-Slug'] = empresaSlug
  }
  return config
})

// client.js não pode importar o AuthContext direto (senão vira
// dependência circular: AuthContext usa authApi, que usa client.js).
// Em vez disso, o AuthContext REGISTRA aqui uma função pra ser chamada
// quando qualquer requisição vier com 401 (token ausente/expirado/
// inválido) — é a forma mais simples de "avisar" a aplicação inteira
// pra deslogar, sem acoplar os dois arquivos um ao outro.
let aoReceberNaoAutorizado = null

export function FnsetUnauthorizedHandler(fn) {
  aoReceberNaoAutorizado = fn
}

// A Api (ver Barbearia.Api/Middleware/ExceptionHandlingMiddleware.cs)
// responde erro de negócio como JSON no formato:
//   { status: 400, title: "Requisição inválida", detail: "...", traceId: "..." }
// Esse interceptor troca o texto genérico do axios ("Request failed
// with status code 400") pela mensagem de negócio real (`detail`), pra
// toda tela só precisar fazer `catch (err) { mostrarErro(err.message) }`
// sem repetir essa extração em cada lugar.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail

    if (error.response?.status === 401) {
      error.message = detail ?? 'Sua sessão expirou. Faça login novamente.'
      aoReceberNaoAutorizado?.()
    } else if (detail) {
      error.message = detail
    } else if (error.code === 'ERR_NETWORK') {
      error.message = 'Não foi possível conectar à Api. Ela está rodando (dotnet run)?'
    }

    return Promise.reject(error)
  },
)
