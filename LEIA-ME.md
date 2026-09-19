# Barbearia — Front-end (Fase 3)

Front-end em React + Tailwind CSS que consome a Api .NET da Fase 2.
Diferente da Api, este projeto usa npm/Vite — que funcionou normalmente
no ambiente onde eu escrevi o código, então **já testei tudo aqui antes
de te mandar**: `npm run build` passou limpo, e cheguei a rodar o app de
verdade num navegador (com uma Api "de mentira" simulando respostas) só
pra confirmar que nenhuma tela quebra ao carregar, abrir um modal, editar
um campo, ou passar pelo fluxo completo de cadastro → login → navegar
autenticado → logout → tentar voltar sem sessão. Ainda assim, o teste
real — com a SUA Api e o SEU banco — só você pode fazer.

## Passo a passo para rodar

### 1. Pré-requisitos
- Node.js 18+ (o `npm --version` deve funcionar no terminal)
- A Api da Fase 2 rodando (`dotnet run --project src/Barbearia.Api`,
  normalmente em `http://localhost:5042`)

### 2. Instalar dependências

```bash
cd frontend
npm install
```

### 3. Configurar a URL da Api

Copie `.env.example` para `.env` (o `.env.development` já vem com o
valor padrão `http://localhost:5042/api` — só precisa mudar se a sua Api
rodar em outra porta):

```bash
cp .env.example .env
```

### 4. Rodar

```bash
npm run dev
```

Abre em `http://localhost:5173`. Com a Api rodando, você já consegue
cadastrar clientes, serviços, usuários/barbeiros, planos e criar
agendamentos direto pela interface.

### 5. Build de produção (opcional, pra ver o resultado final)

```bash
npm run build
npm run preview
```

## Estrutura

```
frontend/src/
├── api/            # Um arquivo por recurso (clientes.js, servicos.js, auth.js...),
│                   # cada função aqui é uma chamada HTTP pra uma rota
│                   # específica dos Controllers da Api. client.js tem a
│                   # instância única do axios + tratamento de erro + o
│                   # header Authorization automático (ver seção de Login).
├── context/
│   └── AuthContext.jsx # Quem está logado (token + usuário), login/registrar/logout,
│                   # disponível em qualquer tela via useAuth().
├── hooks/
│   └── useAsync.js # Hook genérico pra "buscar dados, mostrar loading,
│                   # mostrar erro" — usado em toda tela que lista algo.
├── components/
│   ├── Layout.jsx  # Barra lateral (com usuário logado + Sair) + conteúdo da rota
│   ├── RotaProtegida.jsx # Redireciona pra /login quem não estiver autenticado
│   ├── AuthLayout.jsx    # Molde visual das telas de Login/Cadastro
│   └── ui/         # Peças reutilizáveis: Button, Field/Input/Select/PasswordInput,
│                   # Badge (cor por status), Modal, PageHeader, Spinner...
├── pages/          # Uma página por tela: Login, Cadastro, Agenda, Clientes,
│                   # Servicos, Barbeiros, Planos (+ Assinaturas), Usuarios.
├── App.jsx         # Define as rotas (URL -> página)
└── main.jsx         # Ponto de entrada — monta o React na página
```

## Como cada tela conversa com a Api

Todo `fetch`/`axios` fica isolado em `src/api/*.js` — nenhuma página faz
uma chamada HTTP direta. Isso é o mesmo princípio de "camadas" que você
aplicou no back (Controller não fala com o banco direto, fala com o
Service): aqui, a página React não fala com o `axios` direto, fala com
`clientesApi.criar(...)`, por exemplo. Se um dia trocar de biblioteca de
HTTP (axios -> fetch nativo, por exemplo), só muda `src/api/client.js` e
os arquivos dentro de `src/api/` — nenhuma página precisa mudar.

Erros de negócio que a Api devolve (400/404/409 — ver
`api/src/Barbearia.Api/Middleware/ExceptionHandlingMiddleware.cs`) chegam
até a tela já com a mensagem certa (ex.: "Este barbeiro já tem um
agendamento nesse horário"), graças ao interceptor em `src/api/client.js`
que extrai o campo `detail` da resposta.

## Telas

| Tela | O que faz |
|---|---|
| **Login** (`/login`) | E-mail + senha. Sem sessão válida, qualquer rota protegida cai aqui automaticamente. |
| **Cadastro** (`/cadastro`) | Cria a conta do usuário (nome, e-mail, senha) e já entra logado. Nasce como usuário Comum — só a primeira conta do sistema vira Admin automaticamente (ver LEIA-ME.md da Fase 2). |
| **Agenda** (`/`) | Escolhe um barbeiro + um dia, vê os agendamentos, cria novo agendamento, e aplica as transições de status (confirmar → iniciar atendimento → concluir, ou cancelar/não compareceu) |
| **Clientes** | CRUD + ativar/inativar/bloquear |
| **Serviços** | Catálogo — criar, editar preço direto na tabela, inativar |
| **Barbeiros** | Criar barbeiro a partir de um Usuario, cadastrar horários de trabalho |
| **Planos de assinatura** | Criar planos, incluir serviços num plano, e (na mesma tela, seção de baixo) gerenciar as assinaturas de um cliente específico |
| **Pagamentos** | Só aparece na barra lateral pra quem logou como Admin ou Barbeiro. Aba "Hoje" com os pagamentos pendentes do dia (nascem sozinhos quando um agendamento é concluído — ver LEIA-ME.md da Fase 2) pra confirmar ou marcar como não pago, e aba "Histórico" pra ver os últimos dias. |
| **Usuários** | Só aparece na barra lateral pra quem logou como Admin ou Barbeiro. Cadastro de outras contas (ex.: um barbeiro, ou outro admin) — diferente do `/cadastro`, que é auto-serviço e sempre cria um usuário Comum. |

## Quem pode fazer o quê (Admin/Barbeiro x Comum)

Admin e Barbeiro têm o mesmo nível de acesso — gerenciam tudo. Um usuário
Comum só enxerga os botões de criar/editar/inativar/bloquear/etc. quando
`useAuth().ehStaff` é `true` (ver `src/context/AuthContext.jsx`); as
páginas Clientes, Serviços, Barbeiros, Planos/Assinaturas e as transições
de Agendamento escondem essas ações pra ele. Isso é só uma questão de UX
— quem garante de verdade é a Api, recusando a chamada com `403` mesmo
que alguém tente pelo DevTools (ver a tabela de permissões no LEIA-ME.md
da Fase 2). A única exceção: Comum também pode criar (marcar) e cancelar
o próprio agendamento — só as outras transições (confirmar, iniciar
atendimento, concluir, não compareceu) ficam escondidas/bloqueadas.

## Como o login funciona

1. `/login` e `/cadastro` chamam `authApi.login`/`authApi.registrar`
   (`src/api/auth.js`), que batem em `POST /api/auth/login` e
   `POST /api/auth/registrar` na Api — as únicas rotas públicas dela.
2. A resposta é `{ token, usuario }`. O `AuthContext` guarda os dois no
   `localStorage` (pra sobreviver a um F5) e chama
   `setAuthToken(token)` em `src/api/client.js`, que passa a mandar
   `Authorization: Bearer <token>` em toda requisição seguinte.
3. Todo o resto da Api exige esse token (ver LEIA-ME.md da Fase 2) — se
   ele expirar ou for inválido, a Api responde 401, o `client.js`
   percebe isso e desloga automaticamente (volta pra `/login`).
4. `RotaProtegida` (em `App.jsx`) é o que impede alguém de digitar
   `/clientes` na barra de endereço sem estar logado.

## O que ficou de fora

- **Pagamentos** — a Api ainda não expõe esse recurso (ver LEIA-ME.md da
  Fase 2), então o front também não tem tela pra isso ainda.
- **Recuperar senha** ("esqueci minha senha") — não existe endpoint pra
  isso na Api ainda.

São bons candidatos pra uma próxima etapa, se quiser.
