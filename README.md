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

## App Android (Play Store)

O front virou também app Android de verdade, via
[Capacitor](https://capacitorjs.com/) — sem reescrever nada: o app é uma
casca nativa que abre o site já publicado na Vercel (`capacitor.config.json`
→ `server.url`). Isso significa que **um `git push` que atualiza o site já
atualiza o app sozinho**, sem precisar gerar um apk novo pra cada mudança
de tela — só quando mudar algo fora da tela (ícone, nome, versão) que
precisa gerar um apk novo.

**Importante: isto gera o app de UMA barbearia (pro cliente/staff dela
usar), não "o app do sistema".** A área `/admin` (criar/gerenciar
barbearias, uso só seu) continua sendo só site, sem app — não faz sentido
um cliente de barbearia ter isso no celular. Cada barbearia que quiser
o próprio app vira um projeto separado, gerado a partir deste mesmo
molde (`capacitor.config.json` aponta pro link daquela barbearia
específica, ex.: `.../barbearia-do-joao`, não pra raiz do site).

O arquivo é `.json` (dado puro, sem código) de propósito — já tivemos
problema com `.ts` (incompatível com versões novas do TypeScript) e com
`.js` (bug do Capacitor lendo `.js` de projeto ESM) — `.json` não tem
como dar esse tipo de erro.

### Gerar o app de uma barbearia (repita isso pra cada barbearia nova)

1. Em `capacitor.config.json`, troque `appId` (único por barbearia),
   `appName` (nome que aparece no celular) e a URL dentro de
   `server.url` (a raiz do site + `/` + o slug daquela barbearia).
2. Rode `npm run android:novo` — **não** é o `android:sync` (esse só
   atualiza o que já existe; `appId`/`appName` só entram de verdade
   recriando a pasta `android/` do zero, é o que esse comando faz).
3. Siga o passo a passo abaixo normalmente.

Se quiser manter o histórico de qual configuração é de qual barbearia,
uma ideia simples: depois de gerar o apk de uma barbearia, guarde uma
cópia da pasta inteira `frontend/` renomeada (ex.:
`frontend-app-barbearia-do-joao/`) antes de trocar `capacitor.config.json`
pra próxima — assim não perde o que já configurou.

### Pré-requisito

[Android Studio](https://developer.android.com/studio) instalado no seu
computador (é ele que compila o app — aqui no ambiente onde eu preparei
isso não tem como compilar de verdade, só gerar os arquivos do projeto).

### Gerar/atualizar o projeto Android

```bash
cd frontend
npm run android:novo   # (só na primeira vez, ou depois de trocar appId/appName/URL)
npm run android:open   # abre o projeto no Android Studio
```

Numa atualização comum (só o conteúdo das telas mudou, `appId`/`appName`
continuam os mesmos), nem precisa disso — o app já busca a versão nova
sozinho da Vercel na próxima vez que abrir, sem gerar nada.

Dentro do Android Studio: **Build → Generate Signed App Bundle/APK** pra
gerar o arquivo que sobe na Play Store (formato `.aab`, recomendado pela
própria Google).

### Antes de publicar

- **Ícone do app**: hoje está com o ícone padrão do Capacitor — troque
  pela logo da barbearia. Jeito mais fácil: colocar uma imagem quadrada
  (1024×1024) em `frontend/assets/icon.png` e rodar
  `npx @capacitor/assets generate --android` (gera todos os tamanhos
  sozinho).
- **Conta de desenvolvedor Google Play** — taxa única de $25.
- **Política de privacidade** — a Play Store exige um link pra uma
  página de política de privacidade, mesmo pra um app simples.
- **Chave de assinatura** (`keystore`) — gerada uma vez no próprio
  Android Studio ao criar o Signed Bundle; guarde esse arquivo e a senha
  em lugar seguro, sem ela você não consegue mais publicar ATUALIZAÇÕES
  do mesmo app depois (só um app novo, do zero).

### Estrutura

```
frontend/
├── capacitor.config.json # appId, nome do app, e a URL que o app abre
└── android/              # projeto nativo Android (gerado pelo Capacitor,
                           # abre direto no Android Studio)
```
