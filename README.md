# Barbearia — Front-end

Front-end em **React + Tailwind CSS** que consome a [Barbearia
Api](../api/README.md). Também é multi-barbearia: um site só, servindo
várias barbearias diferentes, cada uma no seu próprio link.

## Stack

- **React 19** + **React Router 7**
- **Tailwind CSS v4**
- **Vite** (build/dev server)
- **Axios**
- Deploy na **Vercel**

## Multi-barbearia (multi-tenant) no front

Cada barbearia vive sob seu próprio link: `seusite.com/:slug/...` (ex.:
`seusite.com/barbearia-do-joao/agenda`). O `slug` na URL é o que separa
uma barbearia da outra aqui no front — toda chamada à Api manda esse
slug no header `X-Empresa-Slug` (ver `src/api/client.js`) pra ela saber
de qual barbearia é a requisição.

Duas áreas ficam FORA desse esquema de barbearia:
- **`/`** — landing page pública, não pertence a nenhuma barbearia.
- **`/admin`** — painel do SuperAdmin (dono da plataforma), onde se
  cadastra/gerencia as barbearias em si (ver `paginas/AdminDashboard.jsx`).

Um link com um `slug` que não existe ou está inativo cai em
`paginas/BarbeariaNaoEncontrada.jsx` (ver `componentes/PortaDaBarbearia.jsx`,
que resolve a configuração da barbearia — nome, logo, cor — antes de
mostrar qualquer tela, inclusive a de login).

## Como rodar localmente

### Pré-requisitos
- Node.js 18+
- A [Api](../api/README.md) rodando (`http://localhost:5042` por padrão)

### Instalar e configurar
```bash
cd frontend
npm install
cp .env.example .env
```

`.env`:
```
VITE_API_URL=http://localhost:5042/api
```

### Rodar
```bash
npm run dev
```
Abre em `http://localhost:5173`. Como não existe barbearia nenhuma sem
passar pelo `/admin` primeiro, o fluxo local normalmente é: logar em
`/admin/login` (com um SuperAdmin já criado no banco) → criar uma
barbearia de teste → acessar `/<slug-criado>/login`.

### Build de produção
```bash
npm run build
npm run preview
```

## Estrutura

```
frontend/src/
├── api/            # Um arquivo por recurso (clientes.js, agendamentos.js...) —
│                   # cada função é uma chamada HTTP a uma rota da Api.
│                   # client.js: instância única do axios, header Authorization
│                   # automático, e o header X-Empresa-Slug do tenant atual.
├── contexto/
│   ├── AuthContext.jsx            # Quem está logado (token + usuário), login/logout,
│   │                               # disponível em qualquer tela via useAuth().
│   └── ConfiguracaoSiteContext.jsx # Config pública da barbearia atual (nome, logo, cor).
├── ganchos/        # Hooks reutilizáveis: useAsync (buscar/loading/erro),
│                   # useCaminhoBarbearia (monta link com o slug certo),
│                   # useTema, useToastErro.
├── componentes/
│   ├── Layout.jsx              # Barra lateral + conteúdo da rota
│   ├── RotaProtegida.jsx       # Bloqueia quem não está logado NAQUELA barbearia
│   ├── RotaProtegidaAdmin.jsx  # Idem, mas pra área /admin (SuperAdmin)
│   ├── PortaDaBarbearia.jsx    # Resolve o slug da URL pra uma barbearia real antes de renderizar
│   ├── AuthLayout.jsx          # Molde visual de Login/Cadastro
│   └── ui/                     # Peças reutilizáveis: Button, Field, Badge, Modal...
├── paginas/        # Uma página por tela (lista completa abaixo)
├── App.jsx         # Mapa de rotas (URL -> página)
└── main.jsx        # Ponto de entrada
```

## Páginas

| Página | Rota | O que faz |
|---|---|---|
| Landing | `/` | Página pública inicial, fora de qualquer barbearia |
| Login do dono da plataforma | `/admin/login` | Login do SuperAdmin |
| Painel da plataforma | `/admin` | Lista, cria, ativa/inativa barbearias |
| Login da barbearia | `/:slug/login` | Login de quem já tem conta nessa barbearia |
| Cadastro | `/:slug/cadastro` | Autoatendimento — cria conta Comum (primeira conta da barbearia vira Admin sozinha) |
| Agenda | `/:slug/agenda` | Staff: escolhe barbeiro + dia, cria/gerencia agendamentos |
| Meus agendamentos | `/:slug/meus-agendamentos` | Cliente: vê/marca/cancela os próprios horários |
| Fila de espera | `/:slug/fila-de-espera` | Fila de atendimento do dia |
| Solicitações | `/:slug/solicitacoes` | Staff aceita/rejeita horários pedidos por clientes |
| Clientes | `/:slug/clientes` | CRUD + ativar/inativar/bloquear |
| Serviços | `/:slug/servicos` | Catálogo — criar, editar preço/categoria, inativar |
| Barbeiros | `/:slug/barbeiros` | Cadastro, horários de trabalho, ausências |
| Ranking | `/:slug/ranking` | Ranking mensal de clientes, prêmios configuráveis |
| Planos | `/:slug/planos` | Planos de assinatura e suas assinaturas |
| Meu plano | `/:slug/meu-plano` | Cliente: vê/assina/cancela o próprio plano |
| Pagamentos | `/:slug/pagamentos` | Staff: pendentes do dia + histórico |
| Usuários | `/:slug/usuarios` | Staff: cadastra outras contas (barbeiro/admin) da barbearia |
| Perfil | `/:slug/perfil` | Dados/senha/foto de quem está logado |
| Aparência | `/:slug/aparencia` | Admin: nome, logo, cor da barbearia |
| Sobre a barbearia | `/:slug/sobre-barbearia` | Descrição, endereço, fotos — pública, edição só pra staff |

## Papéis (quem vê o quê)

Mesma regra da Api, só reforçada aqui por UX (quem garante de verdade é
sempre a Api, com `403` se alguém tentar pelo DevTools):

- **Admin/Barbeiro** (staff) — mesmo nível, gerenciam tudo da barbearia.
- **Comum** — só enxerga o que é dele (próprio agendamento, próprio
  plano, próprio perfil) — ver `useAuth().ehStaff` em `AuthContext.jsx`.
- **SuperAdmin** — só existe dentro de `/admin`, nunca aparece nas telas
  de uma barbearia específica.

## Deploy

Vercel, conectado ao repositório — a cada push no branch conectado, builda
e sobe sozinho. Variável de ambiente `VITE_API_URL` configurada direto no
painel da Vercel, apontando pra URL da Api no Render.
