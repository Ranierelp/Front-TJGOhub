# TJGOHub — Playwright Results Hub (Frontend)

Frontend do sistema de gerenciamento de resultados de testes automatizados E2E do TJGO.

Consome a API REST Django disponível em `http://localhost:8000/api/v1/`.

## Stack

- **Next.js 15** (App Router + Turbopack)
- **React 18** + **TypeScript 5.6**
- **Tailwind CSS** + **Radix UI** (shadcn/ui)
- **Zustand** — gerenciamento de estado e autenticação
- **Axios** — cliente HTTP com interceptadores JWT
- **React Hook Form** + **Zod** — formulários e validação
- **next-pwa** — suporte a PWA com service worker
- **Sonner** — notificações toast
- **next-themes** — dark mode

## Estrutura de Rotas

```
app/
├── page.tsx              → Redireciona para /auth/login
│
├── auth/
│   ├── login/            → Login com JWT (react-hook-form + zod)
│   ├── registro/         → Cadastro (contato com admin)
│   ├── esqueci-senha/    → Solicitação de reset de senha
│   ├── mudar-senha/      → Confirmação de nova senha
│   ├── verificar-email/  → Aviso de verificação de e-mail
│   └── ativar-conta/     → Ativação de conta por token
│
└── dashboard/
    ├── page.tsx          → Dashboard principal (métricas gerais)
    ├── projetos/         → Lista + CRUD de Projetos
    │   ├── novo/         → Formulário de criação
    │   └── [id]/         → Detalhe do projeto
    │       └── editar/   → Formulário de edição
    ├── casos/            → Lista + CRUD de Casos de Teste
    │   ├── novo/         → Formulário de criação
    │   └── [id]/         → Detalhe do caso
    │       └── editar/   → Formulário de edição
    ├── execucoes/        → Lista de Execuções com filtros e métricas
    │   └── [id]/         → Detalhe da execução: progresso, métricas, resultados
    ├── ambientes/        → Gerenciamento de Ambientes por projeto
    ├── tags/             → Gerenciamento de Tags
    └── configuracoes/    → Configurações do usuário
```

## Hooks Disponíveis

| Hook | Propósito |
|------|-----------|
| `useAuth` | Wrapper do authStore Zustand |
| `useAuthGuard` | `useProtectedRoute` + `useGuestRoute` (redirect automático) |
| `useAuthorization` | Verifica permissões do usuário |
| `useRunDetail` | Busca run + resultados com filtro/paginação independentes |
| `useRuns` | Listagem de execuções com filtros |
| `useProjectDetail` | Detalhe de projeto |
| `useProjectList` / `useProjects` | Listagem de projetos |
| `useCaseList` / `useCreateCase` / `useEditCase` | CRUD de casos de teste |
| `useDashboardData` | Métricas do dashboard principal |
| `useAdminTable` | Tabela genérica com sort + filtro + paginação |
| `useTableFiltering` / `useTableSorting` / `useTablePagination` | Primitivos de tabela |

## Pré-requisitos

- Node.js 18+ (LTS recomendado)
- Backend Django rodando em `http://localhost:8000`

## Setup Local

```bash
npm install
cp .env.example .env.local   # Ajuste as variáveis conforme necessário
npm run dev
```

## Variáveis de Ambiente

| Variável | Descrição | Default |
|----------|-----------|---------|
| `NEXT_PUBLIC_API_URL` | URL do backend Django | `http://localhost:8000` |
| `DJANGO_API_URL` | URL usada pelo proxy server-side | `http://localhost:8000` |
| `NEXT_PUBLIC_API_TIMEOUT` | Timeout das requisições (ms) | `10000` |
| `NEXT_PUBLIC_DEBUG_MODE` | Habilita logs no console | `true` |

## Endpoints da API Consumidos

```
# Auth
POST /api/v1/user/token/              → Login (JWT)
POST /api/v1/user/token/refresh/      → Refresh token
POST /api/v1/user/register/           → Cadastro
POST /api/v1/user/request-password-reset/
POST /api/v1/user/password-reset/
GET|PUT /api/v1/user/user/            → Perfil do usuário

# Projetos
GET|POST        /api/v1/projects/
GET|PUT|DELETE  /api/v1/projects/{uuid}/

# Ambientes
GET|POST        /api/v1/environments/
GET|PUT|DELETE  /api/v1/environments/{uuid}/

# Casos de Teste
GET|POST        /api/v1/test-cases/
GET|PUT|DELETE  /api/v1/test-cases/{uuid}/
POST            /api/v1/test-cases/{uuid}/change-status/

# Execuções
GET|POST        /api/v1/runs/
GET|PUT|DELETE  /api/v1/runs/{uuid}/
GET             /api/v1/runs/{uuid}/results/   (?status=PASSED|FAILED|SKIPPED|FLAKY&page=N)

# Resultados (read-only — criados pelo parser)
GET             /api/v1/results/
GET             /api/v1/results/{uuid}/
POST            /api/v1/results/{uuid}/mark-as-flaky/
GET             /api/v1/results/{uuid}/artifacts/

# Tags
GET|POST        /api/v1/tags/
GET|PUT|DELETE  /api/v1/tags/{uuid}/
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção |
| `npm run start` | Serve a build em produção |
| `npm run lint` | ESLint com autocorreção |
| `npm run lint:check` | ESLint sem autocorreção |
| `npm run type-check` | Verificação TypeScript |
| `npm run clean` | Remove `.next`, `.turbo`, `dist` |

## Autenticação

O projeto usa autenticação **JWT com Zustand**. O fluxo:

1. Login via `POST /api/v1/user/token/` — retorna `access` + `refresh`
2. Tokens armazenados no `localStorage`
3. Axios injeta o Bearer token automaticamente em todas as requisições
4. Ao receber 401, verifica se o token expirou e faz logout + redirect para login
5. Refresh automático via `POST /api/v1/user/token/refresh/` no `checkAuth`

## Licença

Veja o arquivo `LICENSE` na raiz do repositório.
