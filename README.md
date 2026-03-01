# TJGOHub — Playwright Results Hub

Frontend do sistema de gerenciamento de resultados de testes automatizados E2E do TJGO.

Consome a API REST Django disponível em `http://localhost:8000/api/v1/`.

## Stack

- **Next.js 15** (App Router + Turbopack)
- **React 18** + **TypeScript**
- **Tailwind CSS** + **Radix UI** (shadcn/ui)
- **Zustand** — gerenciamento de estado e autenticação
- **Axios** — cliente HTTP com interceptadores JWT
- **React Hook Form** + **Zod** — formulários e validação
- **next-pwa** — suporte a PWA com service worker
- **Sonner** — notificações toast

## Estrutura de rotas

```
app/
├── auth/
│   ├── login/          → Login com JWT
│   └── registro/       → Cadastro (contato com admin)
└── dashboard/
    ├── page.tsx        → Dashboard principal
    ├── projetos/       → CRUD de Projetos
    ├── casos/          → CRUD de Casos de Teste
    ├── execucoes/      → Execuções + Resultados
    ├── tags/           → Gerenciamento de Tags
    └── configuracoes/  → Configurações
```

## Pré-requisitos

- Node.js 18+ (LTS recomendado)
- Backend Django rodando em `http://localhost:8000`

## Setup local

```bash
npm install
cp .env.example .env.local   # Ajuste as variáveis conforme necessário
npm run dev
```

## Variáveis de ambiente

| Variável | Descrição | Default |
|----------|-----------|---------|
| `NEXT_PUBLIC_API_URL` | URL do backend Django | `http://localhost:8000` |
| `DJANGO_API_URL` | URL usada pelo proxy server-side | `http://localhost:8000` |
| `NEXT_PUBLIC_API_TIMEOUT` | Timeout das requisições (ms) | `10000` |
| `NEXT_PUBLIC_DEBUG_MODE` | Habilita logs no console | `true` |

## Endpoints da API consumidos

```
POST /api/v1/user/token/          → Login (JWT)
POST /api/v1/user/token/refresh/  → Refresh token
POST /api/v1/user/register/       → Cadastro

GET|POST        /api/v1/projects/
GET|PUT|DELETE  /api/v1/projects/{uuid}/

GET|POST        /api/v1/environments/
GET|PUT|DELETE  /api/v1/environments/{uuid}/

GET|POST        /api/v1/test-cases/
GET|PUT|DELETE  /api/v1/test-cases/{uuid}/
POST            /api/v1/test-cases/{uuid}/change-status/
GET             /api/v1/test-cases/by-project/{uuid}/

GET|POST        /api/v1/runs/
GET|PUT|DELETE  /api/v1/runs/{uuid}/
GET             /api/v1/runs/{uuid}/results/

GET             /api/v1/results/
GET             /api/v1/results/{uuid}/

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
