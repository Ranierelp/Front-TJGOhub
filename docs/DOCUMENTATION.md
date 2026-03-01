# Documentação Completa do Boilerplate Front-end

> Documentação técnica voltada para desenvolvedores que utilizarão este boilerplate como base para novos projetos.

---

## 1. Visão Geral do Boilerplate

### Objetivo

Este boilerplate é uma base de desenvolvimento front-end pronta para produção, construída com **Next.js 15** e voltada para sistemas web corporativos com autenticação, controle de acesso por papéis (RBAC) e suporte a PWA.

### Tipo de Aplicação Suportada

Aplicações do tipo **SaaS / sistema interno / painel administrativo** que requerem:

- Autenticação via token JWT (integração genérica, pronta para qualquer backend)
- Controle de acesso granular por papéis (`admin`, `staff`, `user`, etc.)
- Comunicação com APIs REST via Axios
- Experiência de aplicativo nativo (PWA)

### Problemas que Resolve

| Problema | Solução no Boilerplate |
|----------|------------------------|
| Configuração repetitiva de autenticação JWT | Store Zustand pré-configurada com persistência e refresh automático |
| Proteção manual de rotas | `useAuthGuard` e `useProtectedRoute` centralizados |
| Setup de cliente HTTP | `apiClient` Axios com interceptadores prontos |
| Controle de permissões espalhado | `useAuthorization` e `AdminAuthWrapper` centralizados |
| Falta de padrão para tabelas complexas | `GenericTable` + `useAdminTable` reutilizáveis |
| Inconsistência de UI | Componentes Radix UI + CVA em `components/ui/` (estilo shadcn/ui) |

### Principais Vantagens

- **Autenticação JWT genérica** desacoplada de qualquer provider externo — pronta para qualquer backend
- **PWA out-of-the-box** com `next-pwa` configurado
- **Design system completo** com Radix UI + CVA + Tailwind CSS + dark/light mode
- **Validação de formulários** com Zod + React Hook Form já integrados
- **Bundle Analyzer** configurado para análise de performance
- **Headers de segurança** via middleware (CSP, X-Frame-Options, etc.)
- **TypeScript** strict em todo o projeto
- **Notificações toast** com Sonner pré-configurado

---

## 2. Tecnologias e Stack

### Framework Principal

| Tecnologia | Versão | Papel |
|------------|--------|-------|
| **Next.js** | 15.3.1 | Framework React com App Router, SSR, SSG e suporte a Turbopack |
| **React** | 18.3.1 | Biblioteca de interface |
| **TypeScript** | — | Tipagem estática em todo o projeto |

O projeto utiliza o **App Router** do Next.js 15, com a pasta `app/` como raiz de roteamento.

### Biblioteca de UI

| Tecnologia | Papel |
|------------|-------|
| **Radix UI** | Primitivos de componentes acessíveis e sem estilo (base dos `components/ui/`) |
| **class-variance-authority (CVA)** | Variantes de componentes (variant, size, etc.) |
| **tailwind-merge + clsx** | Composição segura de classes Tailwind via `cn()` em `lib/utils.ts` |
| **Lucide React** | Ícones SVG |
| **React Icons** | Ícones adicionais |
| **Framer Motion** | Animações e transições |
| **Headless UI** | Primitivos de acessibilidade sem estilo |
| **Sonner** | Notificações toast globais |

### Gerenciamento de Estado

| Tecnologia | Papel |
|------------|-------|
| **Zustand** v5 | Store global de autenticação (`authStore.ts`) com persistência no `localStorage` |

O Zustand é usado com os middlewares `devtools` e `persist`. O estado de autenticação (`user`, `isAuthenticated`) é persistido entre sessões automaticamente.

### Estilização

| Tecnologia | Papel |
|------------|-------|
| **Tailwind CSS** | Utilitários CSS — estilização principal de todos os componentes |
| **PostCSS** | Pipeline de transformação CSS |
| **next-themes** | Gerenciamento de tema claro/escuro com zero flash |

### Bibliotecas Auxiliares

| Tecnologia | Papel |
|------------|-------|
| **Axios** | Cliente HTTP com suporte a interceptadores |
| **React Hook Form** | Gerenciamento de formulários performático |
| **Zod** | Validação de schemas com inferência de tipos TypeScript |
| **next-pwa** | PWA: service worker, cache, offline fallback |
| **Lodash** | Utilitários JavaScript (debounce, deep clone, etc.) |
| **react-joyride** | Tours guiados de onboarding |
| **react-intersection-observer** | Lazy loading e animações por visibilidade |

### Ferramentas de Lint e Formatação

| Tecnologia | Papel |
|------------|-------|
| **ESLint 9** | Análise estática com flat config (`eslint.config.mjs`) |
| **Prettier** | Formatação automática via `eslint-plugin-prettier` |
| **eslint-plugin-import** | Organização de imports |
| **eslint-plugin-jsx-a11y** | Acessibilidade em JSX |
| **@typescript-eslint** | Regras TypeScript no ESLint |
| **Turbopack** | Bundler ultra-rápido para desenvolvimento (Next.js 15) |

### Ferramentas de Build e Análise

| Tecnologia | Papel |
|------------|-------|
| **@next/bundle-analyzer** | Análise visual do bundle JS (`ANALYZE=true npm run build`) |
| **Turbo** (`turbo.json`) | Orquestração de tasks em monorepo |

> **Nota:** Não há ferramentas de testes configuradas no boilerplate. Recomenda-se adicionar **Vitest** ou **Jest** + **Testing Library**.

---

## 3. Estrutura de Pastas

```
Boilerplate-front/
├── app/                    # Roteamento via App Router do Next.js
│   ├── layout.tsx          # Layout raiz — providers, metadata, PWA
│   ├── page.tsx            # Página inicial (/)
│   ├── providers.tsx       # ThemeProvider (next-themes) + Sonner globais
│   ├── error.tsx           # Página de erro global
│   ├── loading.tsx         # Skeleton de carregamento global
│   ├── not-found.tsx       # Página 404
│   ├── global-error.tsx    # Captura de erros críticos de runtime
│   ├── auth/               # Grupo de rotas públicas de autenticação
│   │   ├── login/
│   │   ├── registro/
│   │   ├── esqueci-senha/
│   │   ├── mudar-senha/
│   │   ├── ativar-conta/
│   │   └── verificar-email/
│   └── sistema/            # Grupo de rotas protegidas (requer auth)
│       ├── layout.tsx      # Layout Server Component
│       ├── SystemLayoutClient.tsx  # Client Component com guard de rota
│       ├── page.tsx        # Dashboard principal
│       └── settings/       # Sub-rota de configurações
│
├── components/             # Componentes React reutilizáveis
│   ├── auth/               # Wrappers de autenticação/autorização
│   ├── common/             # Componentes genéricos reutilizáveis
│   ├── navbar.tsx          # Barra de navegação principal
│   ├── icons.tsx           # Ícones customizados SVG
│   ├── theme-switch.tsx    # Toggle de tema claro/escuro
│   ├── PWAInstallPrompt.tsx # Banner de instalação PWA
│   └── DisableContextMenu.tsx # Desabilita menu de contexto
│
├── hooks/                  # Hooks React customizados
│   ├── useAuth.ts          # Hook de autenticação (facade do authStore)
│   ├── useAuthGuard.ts     # Proteção de rotas com redirecionamento
│   ├── useAuthorization.ts # Verificação de papéis/permissões
│   ├── useAdminTable.ts    # Lógica completa de tabelas administrativas
│   ├── useTableFiltering.ts# Filtragem e busca de dados
│   ├── useTablePagination.ts # Paginação de tabelas
│   └── useTableSorting.ts  # Ordenação de colunas
│
├── lib/                    # Lógica de negócio e utilitários
│   ├── api/
│   │   ├── client.ts       # Instância Axios com interceptadores JWT
│   │   ├── utils.ts        # Helpers: get, post, put, del, upload, etc.
│   │   ├── index.ts        # Ponto de entrada único da API
│   │   ├── examples.ts     # Exemplos de uso da API
│   │   └── README.md       # Documentação interna da API
│   ├── interfaces/         # Interfaces TypeScript (contratos de dados)
│   ├── types/              # Types e enums globais
│   └── validators/         # Schemas Yup para validação de formulários
│
├── stores/
│   └── authStore.ts        # Store Zustand — estado e ações de auth
│
├── config/
│   ├── site.ts             # Nome do app, nav items, links
│   └── fonts.ts            # Configuração de fontes Next.js
│
├── styles/
│   └── globals.css         # Estilos globais + variáveis Tailwind
│
├── public/                 # Assets estáticos
│   ├── manifest.json       # Manifesto PWA
│   ├── offline.html        # Página de fallback offline
│   └── icons/              # Ícones PWA em múltiplos tamanhos
│
├── docs/                   # Documentação técnica
│   ├── PERMISSIONS.md
│   └── SECURITY.md
│
├── middleware.ts            # Middleware Next.js — CSP + proteção de rotas
├── next.config.js          # Configuração Next.js + PWA + Bundle Analyzer
├── tailwind.config.js      # Configuração Tailwind CSS
├── tsconfig.json           # Configuração TypeScript
└── .env.example            # Template de variáveis de ambiente
```

### Responsabilidade por Pasta

| Pasta | O que vai aqui | Observações |
|-------|---------------|-------------|
| `app/` | Páginas e layouts via file-based routing | Componentes de página, `layout.tsx`, `loading.tsx`, `error.tsx` |
| `components/` | Componentes React reutilizáveis | Nunca lógica de negócio diretamente |
| `hooks/` | Custom hooks React | Toda lógica stateful reutilizável |
| `lib/api/` | Cliente HTTP e helpers de requisição | Único ponto de saída para chamadas de API |
| `lib/types/` | TypeScript types e enums | Tipos compartilhados entre camadas |
| `lib/interfaces/` | Interfaces de contrato de dados | Reflete contratos da API |
| `lib/validators/` | Schemas Yup | Um schema por entidade de domínio |
| `stores/` | Stores Zustand | Um store por domínio (auth, etc.) |
| `config/` | Configurações estáticas do app | Dados que não mudam em runtime |

---

## 4. Arquitetura e Padrões

### Padrão de Organização dos Componentes

Os componentes seguem dois níveis de abstração:

1. **Componentes de Página** — ficam em `app/` e orquestram dados e layout
2. **Componentes de UI** — ficam em `components/` e são puramente visuais ou levemente stateful

```tsx
// Padrão: Server Component para layout (sem "use client")
// app/sistema/layout.tsx
export default function SystemLayout({ children }) {
  return <SystemLayoutClient>{children}</SystemLayoutClient>;
}

// Padrão: Client Component para lógica interativa
// app/sistema/SystemLayoutClient.tsx
"use client";
export default function SystemLayoutClient({ children }) {
  const { isAuthenticated, isLoading } = useProtectedRoute();
  // ...
}
```

### Estratégia de Separação de Responsabilidades

```
Página (app/)
  └── orquestra dados e layout
       ├── Hooks (hooks/)  ← lógica stateful e side effects
       ├── Store (stores/) ← estado global
       └── Componentes (components/) ← apenas renderização
            └── lib/api/  ← chamadas HTTP isoladas
```

### Padrão de Consumo de API

Todas as requisições passam pelo cliente centralizado em `lib/api/`:

```typescript
// 1. Import do ponto de entrada único
import { get, post, put, del } from "@/lib/api";

// 2. Uso nos hooks ou componentes
const buscarUsuarios = async () => {
  const response = await get<User[]>("/v1/users");
  return response.data;
};
```

O cliente Axios (`lib/api/client.ts`) automaticamente:
- Injeta o token JWT em todas as requisições via interceptador
- Redireciona para `/auth/login` no 401 se o token expirar
- Faz retry com exponential backoff para erros de rede/5xx

### Estrutura de Layouts

O projeto usa **dois grupos de layout** dentro do App Router:

| Layout | Caminho | Protegido? | Uso |
|--------|---------|-----------|-----|
| Raiz | `app/layout.tsx` | Não | Providers globais, metadata, PWA |
| Autenticação | `app/auth/*/layout.tsx` | Não (guest) | Páginas de login/registro |
| Sistema | `app/sistema/layout.tsx` | **Sim** | Dashboard e páginas internas |

### Estratégia de Reutilização de Código

- **Hooks compostos**: `useAdminTable` agrega `useTablePagination`, `useTableSorting` e `useTableFiltering`
- **GenericTable**: tabela configurável por props, elimina duplicação em todas as telas de listagem
- **ResponsiveModal / ResponsiveFormModal**: modais adaptativos para mobile/desktop
- **Validators**: schemas Yup centralizados, importados por qualquer formulário

### Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes | PascalCase | `GenericTable.tsx`, `ResponsiveModal.tsx` |
| Hooks | camelCase com `use` | `useAuthGuard.ts`, `useAdminTable.ts` |
| Stores | camelCase + `Store` | `authStore.ts` |
| Types/Interfaces | PascalCase | `User`, `ApiResponse<T>` |
| Arquivos de config | camelCase | `site.ts`, `fonts.ts` |
| Variáveis de ambiente | SCREAMING_SNAKE_CASE | `NEXT_PUBLIC_API_URL` |

---

## 5. Fluxo de Funcionamento do Projeto

### Como uma Nova Página é Criada

O Next.js 15 usa **file-based routing**. Criar um arquivo `page.tsx` dentro de `app/` cria automaticamente uma rota.

```
app/sistema/usuarios/page.tsx  →  /sistema/usuarios
app/sistema/relatorios/page.tsx → /sistema/relatorios
```

### Como os Componentes são Estruturados

```tsx
// app/sistema/usuarios/page.tsx
import { Metadata } from "next";
import ListaUsuarios from "@/components/usuarios/ListaUsuarios";

export const metadata: Metadata = { title: "Usuários" };

// Server Component por padrão — sem "use client"
export default function UsuariosPage() {
  return <ListaUsuarios />;
}
```

```tsx
// components/usuarios/ListaUsuarios.tsx
"use client"; // Client Component quando há estado/efeitos

import { useAdminTable } from "@/hooks/useAdminTable";
import { GenericTable } from "@/components/common/GenericTable";

export default function ListaUsuarios() {
  const { data, isLoading, searchTerm, setSearchTerm } = useAdminTable({
    fetchData: () => get("/v1/users"),
    searchFields: ["username", "email"],
  });

  return <GenericTable data={data} isLoading={isLoading} />;
}
```

### Fluxo de Dados

```
Componente → Hook customizado → lib/api (Axios) → API (Kong Gateway)
                ↕
           Zustand Store (estado global)
```

### Como Requisições HTTP são Feitas

```typescript
import { get, post, put, del } from "@/lib/api";

// GET com tipagem
const usuarios = await get<User[]>("/v1/users");

// POST com body
const novoUsuario = await post<User>("/v1/users", {
  email: "novo@email.com",
  password: "Senha123"
});

// PUT para atualização
await put(`/v1/users/${id}`, { name: "Novo Nome" });

// DELETE
await del(`/v1/users/${id}`);
```

O token JWT é injetado **automaticamente** pelo interceptador — sem necessidade de passar `Authorization` manualmente.

### Como a Autenticação Funciona

```
1. Usuário submete credenciais em /auth/login
        ↓
2. useAuth().login() → authStore.login()
        ↓
3. POST para o endpoint de autenticação da sua API
        ↓
4. Token JWT decodificado → usuário extraído do payload
        ↓
5. Tokens salvos no localStorage + estado Zustand atualizado
        ↓
6. Redirecionamento para /sistema
        ↓
7. Middleware Next.js verifica rota protegida
        ↓
8. SystemLayoutClient → useProtectedRoute() verifica token
        ↓
9. Se token válido → renderiza conteúdo
   Se token expirado → redireciona para /auth/login
```

**Fluxo de refresh automático** (interceptador Axios em `lib/api/client.ts`):
- Resposta 401 → verifica se token está expirado
- Se expirado → `authStore.logout()` + redirect para login
- Se ainda válido → retenta a requisição original

---

## 6. Guia de Uso do Boilerplate

### 1. Instalar o Projeto

```bash
# Clone o repositório
git clone <url-do-repo> meu-projeto
cd meu-projeto/Boilerplate-front

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
```

Edite o `.env.local` com os valores do seu ambiente:

```dotenv
NEXT_PUBLIC_API_URL=https://api.meuservico.com
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_DEBUG_MODE=true
```

### 2. Rodar em Desenvolvimento

```bash
npm run dev           # Next.js com Turbopack (recomendado)
npm run dev:debug     # Dev com inspetor Node.js ativo
```

Acesse: `http://localhost:3000`

### 3. Criar Novas Páginas

**Página pública:**
```bash
# Criar arquivo:
app/contato/page.tsx
```

**Página protegida (requer autenticação):**
```bash
# Criar dentro de /sistema:
app/sistema/relatorios/page.tsx
```

```tsx
// app/sistema/relatorios/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = { title: "Relatórios" };

export default function RelatoriosPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white">Relatórios</h1>
    </div>
  );
}
```

Adicione o link na navbar editando `config/site.ts`:
```typescript
navItems: [
  { label: "Página Inicial", href: "/sistema" },
  { label: "Relatórios", href: "/sistema/relatorios" }, // ← novo item
],
```

### 4. Criar Novos Componentes

```tsx
// components/relatorios/CardRelatorio.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";

interface CardRelatorioProps {
  titulo: string;
  valor: number;
}

export default function CardRelatorio({ titulo, valor }: CardRelatorioProps) {
  return (
    <Card className="p-4">
      <CardContent>
        <p className="text-muted-foreground text-sm">{titulo}</p>
        <p className="text-2xl font-bold">{valor}</p>
      </CardContent>
    </Card>
  );
}
```

> **Regra:** Adicione `"use client"` **somente** quando o componente usar `useState`, `useEffect`, event handlers ou hooks do React.

### 5. Adicionar Novas Rotas com Layout Próprio

```tsx
// app/sistema/relatorios/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = { title: "Relatórios" };

export default function RelatoriosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-white mb-4">Relatórios</h1>
      {children}
    </div>
  );
}
```

### 6. Integrar Novas APIs

**Passo 1:** Adicione a interface de dados em `lib/interfaces/`:
```typescript
// lib/interfaces/relatorioInterfaces.ts
export interface Relatorio {
  id: string;
  titulo: string;
  criadoEm: string;
  status: "pendente" | "concluido";
}
```

**Passo 2:** Crie um hook para buscar os dados em `hooks/`:
```typescript
// hooks/useRelatorios.ts
import { useState, useEffect } from "react";
import { get } from "@/lib/api";
import { Relatorio } from "@/lib/interfaces/relatorioInterfaces";

export function useRelatorios() {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const buscar = async () => {
      try {
        const response = await get<Relatorio[]>("/v1/relatorios");
        setRelatorios(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    buscar();
  }, []);

  return { relatorios, isLoading, error };
}
```

**Passo 3:** Use o hook no componente:
```tsx
// components/relatorios/ListaRelatorios.tsx
"use client";
import { useRelatorios } from "@/hooks/useRelatorios";

export default function ListaRelatorios() {
  const { relatorios, isLoading } = useRelatorios();
  // ...
}
```

### 7. Build para Produção

```bash
npm run build         # Build padrão
npm run build:analyze # Build com análise visual do bundle
npm run start         # Servidor de produção
```

---

## 7. Boas Práticas Adotadas

### Convenções de Código

- **Server Components por padrão** — use `"use client"` apenas quando necessário
- **Tipagem explícita** — evite `any`; use interfaces em `lib/interfaces/` e `lib/types/`
- **Imports absolutos** — use `@/` em vez de caminhos relativos (`../../components/...`)
- **Validação centralizada** — todos os schemas de validação ficam em `lib/validators/`

### Organização de Arquivos

- Um componente por arquivo
- Componentes colocalizados com seus próprios hooks quando possível
- Tipos e interfaces separados dos arquivos de lógica

### Estratégias de Performance

| Estratégia | Onde é aplicada |
|------------|----------------|
| Server Components por padrão | `app/*/page.tsx` e `layout.tsx` sem `"use client"` |
| Otimização de imagens | `next/image` com formatos WebP/AVIF configurados |
| PWA com cache estratégico | `next.config.js` com `runtimeCaching` por tipo de asset |
| Bundle Analyzer | `ANALYZE=true npm run build` para identificar pacotes grandes |
| Turbopack | `npm run dev` usa Turbopack para HMR ultra-rápido |
| Lazy loading | `react-intersection-observer` para carregar componentes sob demanda |

### Estratégias de Escalabilidade

- **Colocação por feature**: ao crescer, agrupe `components/`, `hooks/`, `lib/` por domínio (ex: `features/usuarios/`)
- **Stores por domínio**: um store Zustand por área de negócio
- **API modular**: crie arquivos de serviço por entidade dentro de `lib/api/services/`

### Padrões para Novos Desenvolvedores

1. **Nunca** faça chamadas axios diretamente nos componentes — sempre via `lib/api`
2. **Nunca** acesse `localStorage` diretamente fora do `authStore`
3. **Sempre** adicione tipos TypeScript explícitos em props de componentes
4. **Sempre** use os componentes em `components/ui/` antes de criar um do zero
5. **Sempre** proteja rotas internas usando a pasta `app/sistema/`

---

## 8. Pontos de Extensão

### Onde Adicionar Novas Features

```
app/sistema/[feature]/
  ├── page.tsx          ← página principal
  ├── layout.tsx        ← layout específico (opcional)
  └── [id]/
      └── page.tsx      ← página de detalhe

components/[feature]/   ← componentes específicos da feature
hooks/use[Feature].ts   ← hook de dados da feature
lib/interfaces/[feature]Interfaces.ts  ← tipos de dados
lib/validators/[feature]Validator.ts   ← validações Yup
```

### Onde Adicionar Novos Hooks

Todos os hooks ficam em `hooks/`. Caso o hook seja específico de uma feature maior, considere criar uma subpasta:

```
hooks/
  useAuth.ts
  useAdminTable.ts
  pagamentos/
    usePagamentos.ts
    useCheckout.ts
```

### Onde Adicionar Serviços de API

Crie módulos de serviço dentro de `lib/api/`:

```typescript
// lib/api/services/usuariosService.ts
import { get, post, put, del } from "@/lib/api";
import { User } from "@/lib/interfaces/userInterfaces";

export const usuariosService = {
  listar: () => get<User[]>("/v1/users"),
  buscarPorId: (id: string) => get<User>(`/v1/users/${id}`),
  criar: (data: Partial<User>) => post<User>("/v1/users", data),
  atualizar: (id: string, data: Partial<User>) => put<User>(`/v1/users/${id}`, data),
  deletar: (id: string) => del(`/v1/users/${id}`),
};
```

### Onde Adicionar Contextos Globais

Para estado global novo, crie um store Zustand em `stores/`:

```typescript
// stores/notificacoesStore.ts
import { create } from "zustand";

interface NotificacoesState {
  contagem: number;
  incrementar: () => void;
}

export const useNotificacoesStore = create<NotificacoesState>((set) => ({
  contagem: 0,
  incrementar: () => set((s) => ({ contagem: s.contagem + 1 })),
}));
```

Se preferir Context API do React, crie em `providers/` e adicione ao `app/providers.tsx`.

### Como Manter o Padrão Arquitetural

```
Regra de ouro:

  Página (app/) 
    → usa Hooks (hooks/) 
       → usa Serviços (lib/api/services/) 
          → usa Cliente HTTP (lib/api/client.ts)
             → comunica com a API
```

Nunca pule camadas (ex: componente chamando diretamente o `apiClient` sem passar por um hook ou serviço).

---

## 9. Possíveis Melhorias

### Melhorias de Organização

- **Estrutura por feature**: migrar de organização por tipo (components/, hooks/) para organização por domínio (`features/usuarios/components/`, `features/usuarios/hooks/`) ao escalar
- **Separar exemplos de produção**: o arquivo `lib/api/examples.ts` deve ser excluído ou movido para pasta de docs

### Melhorias de Performance

- **React Query (TanStack Query)**: substituir os hooks de fetch manuais por TanStack Query para cache automático, invalidação e estados de loading/error padronizados
- **Suspense boundaries**: adicionar `<Suspense>` em componentes pesados para streaming SSR
- **Dynamic imports**: usar `next/dynamic` para componentes grandes carregados condicionalmente (ex: modais, gráficos)

### Melhorias de Escalabilidade

- **Testes automatizados**: adicionar **Vitest** + **Testing Library** — atualmente não há nenhum teste no projeto
- **Storybook**: catalogar os componentes do design system
- **Mock Service Worker (MSW)**: mockar a API em desenvolvimento sem depender do backend

### Melhorias de Padronização

- **Error Boundary por feature**: o `error.tsx` global captura tudo; adicionar boundaries específicos por seção
- **i18n**: o `intl-messageformat` está instalado mas não está em uso — estruturar internacionalização
- **Variáveis de ambiente validadas**: usar **@t3-oss/env-nextjs** para validar o `.env` com Zod em build time e evitar erros silenciosos em produção
- **React Query (TanStack Query)**: considerar substituir hooks de fetch manuais para cache automático e estados padronizados

---

## 10. Guia Rápido para Novos Desenvolvedores

### Como Entender o Projeto Rapidamente

| Arquivo | Por que ler primeiro |
|---------|---------------------|
| `app/layout.tsx` | Entende os providers globais e metadados |
| `app/providers.tsx` | Vê quais providers envolvem toda a aplicação |
| `stores/authStore.ts` | Entende como a autenticação funciona |
| `lib/api/client.ts` | Entende como as chamadas HTTP são feitas |
| `middleware.ts` | Vê as regras de segurança e proteção de rotas |
| `config/site.ts` | Vê como configurar nome, rotas e links do app |
| `.env.example` | Vê todas as variáveis necessárias |

### Por Onde Começar

1. Configure seu `.env.local` baseado no `.env.example`
2. Rode `npm install` e `npm run dev`
3. Leia `stores/authStore.ts` para entender o fluxo de autenticação
4. Leia `lib/api/client.ts` para entender como as requisições são feitas
5. Crie sua primeira página em `app/sistema/[sua-feature]/page.tsx`

### Fluxo de Desenvolvimento Esperado

```
1. Defina os tipos da feature em lib/interfaces/ e lib/types/
2. Crie os schemas de validação em lib/validators/
3. Crie o serviço de API em lib/api/services/
4. Crie o(s) hook(s) customizado(s) em hooks/
5. Crie os componentes em components/[feature]/
6. Crie a página em app/sistema/[feature]/page.tsx
7. Adicione o link em config/site.ts (se necessário)
8. Se a feature tiver permissões, use AdminAuthWrapper ou hasRole()
```

---

## 11. Adaptando o Boilerplate para uma Nova API

O boilerplate já vem **desacoplado de qualquer provider de autenticação externo**. O `authStore.ts` usa JWT genérico e o cliente Axios aponta para `NEXT_PUBLIC_API_URL`. Para conectar sua API:

### Arquivos principais para adaptar

| Arquivo | O que alterar |
|---------|---------------|
| `stores/authStore.ts` | Implementar `login()` e `checkAuth()` contra seu endpoint de auth |
| `lib/api/client.ts` | Confirmar que `baseURL` usa `NEXT_PUBLIC_API_URL` |
| `lib/api/index.ts` | Atualizar paths dos endpoints para sua API |
| `middleware.ts` | Atualizar `connectSrc` com o domínio da sua API |
| `.env.local` | Definir `NEXT_PUBLIC_API_URL` |
| `app/sistema/SystemLayoutClient.tsx` | Atualizar nome/marca do sistema |
| `config/site.ts` | Atualizar nome do sistema |

---

### Passo 1 — Limpar o `authStore.ts`

Substitua o conteúdo por uma versão neutra que você adaptará para sua API:

```typescript
// stores/authStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

interface AuthTokens {
  access_token: string;
  refresh_token?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokens: AuthTokens | null;

  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  getAccessToken: () => string | null;
  isTokenExpired: () => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        tokens: null,

        login: async (_credentials: LoginCredentials) => {
          // TODO: implementar login com a nova API
          // Exemplo:
          // const response = await post<AuthTokens>("/auth/login", credentials);
          // const user = decodeUserFromToken(response.data.access_token);
          // set({ user, isAuthenticated: true, tokens: response.data });
          return { success: false, message: "Login não implementado" };
        },

        logout: async () => {
          if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
          }
          set({ user: null, isAuthenticated: false, tokens: null, error: null });
        },

        checkAuth: async () => {
          const token = typeof window !== "undefined"
            ? localStorage.getItem("access_token")
            : null;

          if (!token) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          // TODO: validar token com a nova API ou decodificar JWT
          set({ isLoading: false });
        },

        clearError: () => set({ error: null }),

        getAccessToken: () =>
          typeof window !== "undefined" ? localStorage.getItem("access_token") : null,

        isTokenExpired: () => {
          const token = get().getAccessToken();
          if (!token) return true;
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.exp < Math.floor(Date.now() / 1000);
          } catch {
            return true;
          }
        },

        hasRole: (role) => get().user?.roles?.includes(role) ?? false,
        hasAnyRole: (roles) => roles.some((r) => get().user?.roles?.includes(r)) ?? false,
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: "AuthStore" }
  )
);

// Seletores
export const useAuth = () => useAuthStore((s) => ({
  user: s.user,
  isAuthenticated: s.isAuthenticated,
  isLoading: s.isLoading,
  error: s.error,
}));

export const useAuthActions = () => useAuthStore((s) => ({
  login: s.login,
  logout: s.logout,
  checkAuth: s.checkAuth,
  clearError: s.clearError,
}));
```

---

### Passo 2 — Limpar o `lib/api/client.ts`

Remova as referências ao Kong e configure para sua nova API:

```typescript
// lib/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { useAuthStore } from "@/stores/authStore";

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

const createApiClient = (): AxiosInstance => {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const timeout = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000", 10);

  return axios.create({
    baseURL,
    timeout,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};

export const apiClient = createApiClient();

// Interceptador de request — injeta token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().getAccessToken();
  if (token && !useAuthStore.getState().isTokenExpired()) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptador de response — trata 401
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject({
      message: (error.response?.data as any)?.message || "Erro na requisição",
      status: error.response?.status || 500,
    } as ApiError);
  }
);

export default apiClient;
```

---

### Passo 3 — Limpar o `lib/api/index.ts`

```typescript
// lib/api/index.ts
export { default as apiClient } from "./client";
export type { ApiResponse, ApiError } from "./client";
export { get, post, put, patch, del, upload } from "./utils";

// Configure aqui os caminhos dos seus endpoints
export const apiPaths = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
    refreshToken: "/auth/refresh",
  },
  users: {
    list: "/users",
    create: "/users",
    detail: (id: string) => `/users/${id}`,
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },
  // Adicione outros recursos aqui
};
```

---

### Passo 4 — Atualizar o `middleware.ts`

Confirme que o `connectSrc` aponta para sua API via variável de ambiente:

```typescript
connectSrc.push(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001");
```

---

### Passo 5 — Atualizar o `.env.local`

```dotenv
# URL da sua API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Ambiente
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_DEBUG_MODE=true

# PWA
NEXT_PUBLIC_PWA_ENABLED=true
```

---

### Passo 6 — Atualizar `config/site.ts`

```typescript
export const siteConfig = {
  name: "Meu Sistema",  // ← mude aqui
  description: "Descrição do sistema.",
  // ...
};
```

---

### Checklist de Adaptação

```
[ ] stores/authStore.ts       — implementar login() e checkAuth() para sua API
[ ] lib/api/client.ts         — confirmar que baseURL usa NEXT_PUBLIC_API_URL
[ ] lib/api/index.ts          — atualizar paths dos endpoints
[ ] lib/api/examples.ts       — deletar ou atualizar exemplos
[ ] middleware.ts             — atualizar connectSrc com domínio da API
[ ] .env.local                — definir NEXT_PUBLIC_API_URL
[ ] SystemLayoutClient.tsx    — atualizar nome/marca do sistema
[ ] config/site.ts            — atualizar nome do sistema
[ ] lib/validators/           — atualizar schemas Zod para contratos da nova API
```

### Como Conectar sua API

1. Configure `NEXT_PUBLIC_API_URL` no `.env.local`
2. Implemente `authStore.login()` chamando seu endpoint de autenticação
3. Implemente `authStore.checkAuth()` para validar o token contra seu backend
4. Atualize os schemas Zod em `lib/validators/` para refletir os contratos da nova API
5. Crie serviços em `lib/api/services/` para cada recurso da sua API
6. Use `get()`, `post()`, `put()`, `del()` de `lib/api` nos seus hooks

O cliente HTTP, os interceptadores de token, a proteção de rotas e toda a estrutura de componentes continuam funcionando sem nenhuma modificação.
