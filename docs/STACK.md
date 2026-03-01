# Stack Completa do Boilerplate

Baseado na estrutura do projeto, aqui está a descrição completa de cada tecnologia.

---

## 🏗️ Framework Principal

### Next.js 15 (App Router)
- Base do projeto, responsável por roteamento, SSR, SSG e Server Components
- Usa o **App Router** (`/app` directory) — modelo mais moderno do Next.js
- Suporta layouts aninhados, loading states, error boundaries e middleware
- O arquivo `middleware.ts` na raiz intercepta todas as requisições antes de chegarem às páginas

---

## 🎨 UI e Estilização

### Radix UI + CVA (shadcn/ui style)
- Componentes acessíveis e sem estilo próprio baseados em **Radix UI**
- Estilizados com **Tailwind CSS** usando **class-variance-authority (CVA)** para variantes
- Componentes prontos em `components/ui/` (button, badge, card, input, dialog, etc.)
- Padrão inspirado no **shadcn/ui** — componentes são copiados para o projeto e totalmente customizáveis

### Tailwind CSS
- Estilização utility-first via classes CSS
- Configurado em `tailwind.config.js`
- Estilos globais em `styles/globals.css`
- Usa variáveis CSS para temas (dark/light) via `next-themes`

### class-variance-authority (CVA) + tailwind-merge
- **CVA**: define variantes de componentes (ex: `variant="outline"`, `size="sm"`)
- **tailwind-merge**: resolve conflitos de classes Tailwind ao compor componentes
- **clsx**: utilitário para compor classes condicionalmente
- Combinados no helper `cn()` em `lib/utils.ts`

### PostCSS
- Configurado em `postcss.config.js`
- Processa o Tailwind em CSS puro no build
- Permite plugins de transformação de CSS

### next-themes
- Gerencia o tema claro/escuro da aplicação
- Integrado ao `ThemeSwitcher.tsx` e `theme-switch.tsx`
- Persiste a preferência do usuário no `localStorage`

---

## 🔄 Gerenciamento de Estado

### Zustand
- Gerenciamento de estado global **simples e performático**
- Store principal em `stores/authStore.ts`
- Armazena dados do usuário autenticado, tokens, permissões
- Alternativa mais leve ao Redux, sem boilerplate excessivo

---

## 🌐 Consumo de API

### Axios
- Biblioteca HTTP para requisições ao backend
- Configurada em `lib/api/client.ts`
- Possui interceptors para injetar token JWT automaticamente
- Lida com refresh de token e erros globais (401, 403, 500)

### API Layer (`lib/api/`)
```
lib/api/
├── client.ts    → instância configurada do Axios
├── index.ts     → exporta todos os serviços
├── utils.ts     → helpers de requisição
└── examples.ts  → exemplos de uso
```

---

## ✅ Validação de Formulários

### React Hook Form
- Gerencia estado e validação de formulários com alta performance
- Evita re-renders desnecessários usando refs em vez de state
- Presente nos formulários de login, registro, reset de senha

### Zod
- Schema de validação integrado ao React Hook Form via `@hookform/resolvers/zod`
- Definido em `lib/validators/index.ts` e `lib/validators/userValidator.ts`
- Tipagem TypeScript inferida automaticamente a partir dos schemas
- Exemplo:

```typescript
const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Obrigatório"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

type LoginFormData = z.infer<typeof loginSchema>;
```

---

## 🔐 Autenticação

### JWT (JSON Web Tokens)
- Tokens gerados pela API e armazenados no Zustand (com persistência)
- Injetados automaticamente pelo interceptor do Axios em todas as requisições
- Decodificados para extrair roles e permissões do usuário
- O `authStore.ts` está desacoplado de qualquer provider externo — pronto para integrar com qualquer backend

> **Nota:** A integração com Keycloak foi removida. O store atual funciona com JWT genérico e aceita qualquer API de autenticação.

### Sonner
- Biblioteca de notificações toast (substitui react-toastify e similares)
- Configurada globalmente em `app/providers.tsx`
- Uso: `import { toast } from "sonner"; toast.success("Sucesso!");`

---

## 🛡️ Autorização

### Sistema de Permissões Customizado
- Implementado em `hooks/useAuthorization.ts`
- Documentado em `docs/PERMISSIONS.md`
- Controla acesso a rotas e componentes via roles do JWT

### AdminAuthWrapper
- Componente em `components/auth/AdminAuthWrapper.tsx`
- Protege rotas do sistema (`/sistema/*`) contra acesso não autorizado

---

## 📱 PWA (Progressive Web App)

### next-pwa
- Transforma a aplicação em PWA instalável
- Configurado em `next.config.js`
- `public/manifest.json` — define nome, ícones e cores do app
- `public/offline.html` — página exibida sem conexão
- Service Worker gerado automaticamente no build

---

## 🪝 Hooks Customizados

```
hooks/
├── useAuth.ts              → acesso ao estado de autenticação
├── useAuthGuard.ts         → proteção de rotas privadas
├── useAuthorization.ts     → verificação de permissões
├── useAdminTable.ts        → lógica completa de tabelas admin
├── useTableFiltering.ts    → filtros de tabela
├── useTablePagination.ts   → paginação de tabela
└── useTableSorting.ts      → ordenação de tabela
```

Cada hook resolve **uma responsabilidade específica**, seguindo o princípio da responsabilidade única (SRP).

---

## 🏃 Performance e Build

### Turbo (Turborepo)
- Configurado em `turbo.json` e `.turborc.js`
- Acelera o build com cache inteligente de tasks
- Permite escalar para monorepo no futuro

### SWC (via Next.js)
- Compilador ultra-rápido em Rust, substitui o Babel
- Habilitado por padrão no Next.js 14+
- Reduz drasticamente o tempo de build e HMR

---

## 🔧 Qualidade de Código

### ESLint
- Configurado em `eslint.config.mjs` (formato flat config — ESLint 9+)
- Regras específicas para Next.js e TypeScript
- Integrado ao workflow de desenvolvimento

### TypeScript
- Tipagem estática em todo o projeto
- Configurado em `tsconfig.json`
- Interfaces em `lib/interfaces/` e tipos em `lib/types/`
- Elimina erros em runtime e melhora o IntelliSense

---

## 📦 Pacotes e Dependências

### pnpm (via .npmrc)
- Gerenciador de pacotes mais eficiente que npm/yarn
- Usa hardlinks para economizar espaço em disco
- Configurado no `.npmrc` para workspaces

---

## 🗺️ Resumo Visual da Stack

```
┌─────────────────────────────────────────────┐
│              NEXT.JS 15 (App Router)         │
├──────────────┬──────────────┬────────────────┤
│  Radix UI    │  Tailwind    │   next-themes  │ ← UI/Estilo
│  + CVA       │  + clsx      │   + Sonner     │
├──────────────┼──────────────┼────────────────┤
│   Zustand    │     JWT      │   Axios        │ ← Estado/Auth/HTTP
├──────────────┼──────────────┼────────────────┤
│  RHF + Zod   │   next-pwa   │  Framer Motion │ ← Forms/PWA/Anim
├──────────────┼──────────────┼────────────────┤
│  TypeScript  │   ESLint     │  Turbopack     │ ← DX/Build
└──────────────┴──────────────┴────────────────┘
```

---

> **Observação:** A stack foi montada priorizando **Developer Experience (DX)**, performance e escalabilidade. Cada biblioteca tem um papel bem definido, evitando sobreposição de responsabilidades.
