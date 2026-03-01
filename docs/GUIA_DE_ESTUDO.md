# 📚 Guia de Estudo do Boilerplate

> Documento criado para ajudar novos desenvolvedores a entender **o que está implementado**, **onde está** e **como usar** cada parte do projeto.

---

## Sumário

1. [Visão Geral da Estrutura](#1-visão-geral-da-estrutura)
2. [Autenticação e Sessão](#2-autenticação-e-sessão)
3. [Cliente HTTP (API Layer)](#3-cliente-http-api-layer)
4. [Proteção de Rotas](#4-proteção-de-rotas)
5. [Sistema de Permissões](#5-sistema-de-permissões)
6. [Componentes de UI](#6-componentes-de-ui)
7. [Hooks Customizados](#7-hooks-customizados)
8. [Formulários e Validação](#8-formulários-e-validação)
9. [Gerenciamento de Tema](#9-gerenciamento-de-tema)
10. [PWA (Progressive Web App)](#10-pwa-progressive-web-app)
11. [Segurança (Middleware e CSP)](#11-segurança-middleware-e-csp)
12. [Configuração Global do App](#12-configuração-global-do-app)
13. [Notificações Toast](#13-notificações-toast)
14. [Build, Lint e Ferramentas](#14-build-lint-e-ferramentas)
15. [Mapa Mental: Como Tudo se Conecta](#15-mapa-mental-como-tudo-se-conecta)

---

## 1. Visão Geral da Estrutura

```
Boilerplate-front/
├── app/                  → Páginas e layouts (Next.js App Router)
├── components/           → Componentes React reutilizáveis
├── hooks/                → Hooks customizados
├── lib/
│   ├── api/              → Cliente HTTP centralizado (Axios)
│   ├── interfaces/       → Interfaces TypeScript (contratos de dados)
│   ├── types/            → Types e enums globais
│   └── validators/       → Schemas de validação (Zod/Yup)
├── stores/               → Estado global (Zustand)
├── config/               → Configurações estáticas do app
├── styles/               → Estilos globais (Tailwind)
├── public/               → Assets estáticos + ícones PWA
├── docs/                 → Documentação técnica
└── middleware.ts         → Intercepta TODAS as requisições (CSP + rotas)
```

### Regra de ouro da arquitetura

```
Página (app/)
  └── usa Hooks (hooks/)
       └── usa Serviços (lib/api/services/)
            └── usa Cliente HTTP (lib/api/client.ts)
                 └── comunica com a API
```

> **Nunca** chame o `apiClient` diretamente de um componente. Sempre passe por um hook ou serviço.

---

## 2. Autenticação e Sessão

### 📁 Arquivo principal: `stores/authStore.ts`

O coração da autenticação. É um **store Zustand** que guarda o estado do usuário autenticado e os tokens JWT.

#### O que está armazenado no store

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `user` | `User \| null` | Dados do usuário logado |
| `isAuthenticated` | `boolean` | Se o usuário está autenticado |
| `isLoading` | `boolean` | Se há uma operação em andamento |
| `error` | `string \| null` | Mensagem de erro da última operação |
| `tokens` | `AuthTokens \| null` | Access token + refresh token |

#### Ações disponíveis

| Ação | O que faz |
|------|-----------|
| `login(credentials)` | Envia credenciais para a API e salva o token |
| `logout()` | Limpa o estado e redireciona para login |
| `checkAuth()` | Valida se o token atual ainda é válido |
| `getAccessToken()` | Retorna o access token atual |
| `isTokenExpired()` | Verifica se o token expirou |
| `hasRole(role)` | Verifica se o usuário tem um papel específico |
| `hasAnyRole(roles[])` | Verifica se o usuário tem pelo menos um dos papéis |
| `clearError()` | Limpa a mensagem de erro |

#### Como usar em um componente

```typescript
import { useAuthStore } from "@/stores/authStore";

// Leitura de estado (selector específico para evitar re-renders)
const user = useAuthStore((s) => s.user);
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

// Ações
const login = useAuthStore((s) => s.login);
const logout = useAuthStore((s) => s.logout);
```

#### Ou via hook de facade (recomendado)

```typescript
import { useAuth } from "@/hooks/useAuth";

const { user, isAuthenticated, isLoading, login, logout } = useAuth();
```

#### Persistência automática

O Zustand usa o middleware `persist` — os tokens e dados do usuário são salvos automaticamente no `localStorage` e restaurados ao recarregar a página.

---

### 📁 Páginas de autenticação: `app/auth/`

| Rota | Arquivo | Status |
|------|---------|--------|
| `/auth/login` | `app/auth/login/page.tsx` | ✅ Funcional |
| `/auth/esqueci-senha` | `app/auth/esqueci-senha/page.tsx` | ⚠️ Sem integração com API |
| `/auth/mudar-senha` | `app/auth/mudar-senha/page.tsx` | ⚠️ TODO no `onSubmit` |
| `/auth/ativar-conta` | `app/auth/ativar-conta/page.tsx` | ✅ Estruturado |
| `/auth/verificar-email` | `app/auth/verificar-email/page.tsx` | ✅ Estruturado |

---

## 3. Cliente HTTP (API Layer)

### 📁 Pasta: `lib/api/`

Toda comunicação com a API passa por aqui. **Nunca use axios diretamente nos componentes.**

```
lib/api/
├── client.ts    → Instância configurada do Axios + interceptadores
├── utils.ts     → Funções helper: get, post, put, del, upload, etc.
├── index.ts     → Ponto de entrada único (exporte tudo daqui)
└── examples.ts  → Exemplos de uso (deve ser deletado em produção)
```

### `lib/api/client.ts` — O que faz automaticamente

1. **Injeta o token JWT** em todas as requisições via header `Authorization: Bearer <token>`
2. **Redireciona para `/auth/login`** quando recebe resposta `401`
3. **Lê a URL base** da variável de ambiente `NEXT_PUBLIC_API_URL`

### `lib/api/utils.ts` — Funções disponíveis

```typescript
import { get, post, put, patch, del, upload, download, getPaginated, getCached } from "@/lib/api";

// Requisição GET simples
const response = await get<User[]>("/v1/users");
console.log(response.data); // User[]

// POST com body
const novoUsuario = await post<User>("/v1/users", {
  email: "joao@email.com",
  password: "Senha123"
});

// PUT para atualização completa
await put(`/v1/users/${id}`, { name: "João Silva" });

// PATCH para atualização parcial
await patch(`/v1/users/${id}`, { name: "João" });

// DELETE
await del(`/v1/users/${id}`);

// Upload de arquivo
const file = new File(["conteúdo"], "arquivo.txt");
await upload("/v1/arquivos", file);

// Download de arquivo
await download("/v1/arquivos/123", "documento.pdf");

// GET com paginação automática
const paginado = await getPaginated<User>("/v1/users", {
  page: 1,
  limit: 20,
  search: "joão",
  filters: { role: "admin" }
});
console.log(paginado.data.pagination.totalPages);

// GET com cache (5 minutos)
const cached = await getCached<User[]>("/v1/users", 300000);
```

### Tratamento de erro padrão

```typescript
try {
  const response = await get<User[]>("/v1/users");
  // response.data contém os dados
} catch (error: any) {
  // error.message → mensagem legível
  // error.status  → código HTTP (404, 500, etc.)
  console.error(error.message);
}
```

### `lib/api/index.ts` — Configuração de endpoints

Define as URLs base de cada serviço com base nas variáveis de ambiente:

```typescript
// lib/api/index.ts
export const api = {
  auth: {
    baseUrl: process.env.NEXT_PUBLIC_AUTH_SERVICE_PATH || "/api/v1/user/auth",
  },
  users: {
    baseUrl: process.env.NEXT_PUBLIC_USER_SERVICE_PATH || "/api/v1/users",
  },
};

// Helper para construir URLs
export const buildServiceUrl = (service: "auth" | "users", endpoint: string) => ...
```

### Criando um serviço de API (padrão recomendado)

```typescript
// lib/api/services/produtosService.ts
import { get, post, put, del } from "@/lib/api";
import { Produto } from "@/lib/interfaces/produtoInterfaces";

export const produtosService = {
  listar: () => get<Produto[]>("/v1/produtos"),
  buscarPorId: (id: string) => get<Produto>(`/v1/produtos/${id}`),
  criar: (data: Partial<Produto>) => post<Produto>("/v1/produtos", data),
  atualizar: (id: string, data: Partial<Produto>) => put<Produto>(`/v1/produtos/${id}`, data),
  deletar: (id: string) => del(`/v1/produtos/${id}`),
};
```

---

## 4. Proteção de Rotas

Existem **duas camadas** de proteção de rotas no projeto:

### Camada 1 — `middleware.ts` (raiz do projeto)

Intercepta **todas** as requisições no servidor antes de chegar à página.

- Verifica se a rota começa com `/sistema`
- Se não há token no cookie → redireciona para `/auth/login`
- Aplica headers de segurança (CSP, X-Frame-Options, etc.)

### Camada 2 — `hooks/useProtectedRoute.ts` (client-side)

Usado dentro do `app/sistema/SystemLayoutClient.tsx`. Executa no navegador:

```typescript
// Uso interno no SystemLayoutClient
const { isAuthenticated, isLoading } = useProtectedRoute();

if (isLoading) return <Skeleton />;
if (!isAuthenticated) return null; // o hook já redirecionou
```

### Como funciona o fluxo completo

```
1. Usuário acessa /sistema/dashboard
         ↓
2. middleware.ts verifica cookie do token
         ↓
3. Se sem token → redirect /auth/login (servidor)
         ↓
4. Se com token → página carrega
         ↓
5. SystemLayoutClient monta → useProtectedRoute() executa
         ↓
6. Verifica token no Zustand (client-side)
         ↓
7. Se expirado → logout + redirect /auth/login
   Se válido  → renderiza children
```

### `components/auth/AdminAuthWrapper.tsx`

Protege partes da UI baseado em papéis (roles):

```tsx
import AdminAuthWrapper from "@/components/auth/AdminAuthWrapper";

// Só renderiza o conteúdo se o usuário for admin
<AdminAuthWrapper requiredRole="admin">
  <BotaoDeletarUsuario />
</AdminAuthWrapper>

// Ou com fallback customizado
<AdminAuthWrapper requiredRole="admin" fallback={<p>Sem permissão</p>}>
  <PainelAdministrativo />
</AdminAuthWrapper>
```

---

## 5. Sistema de Permissões

### 📁 Arquivo: `hooks/useAuthorization.ts`

Hook para verificar permissões baseadas em papéis (RBAC):

```typescript
import { useAuthorization } from "@/hooks/useAuthorization";

const { hasRole, hasAnyRole, canAccess } = useAuthorization();

// Verificar papel específico
if (hasRole("admin")) { ... }

// Verificar qualquer um dos papéis
if (hasAnyRole(["admin", "coordinator"])) { ... }
```

### Criando um hook de permissões por feature

```typescript
// hooks/useProdutoPermissions.ts
import { useAuthStore } from "@/stores/authStore";

export const useProdutoPermissions = () => {
  const hasRole = useAuthStore((s) => s.hasRole);
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole);

  return {
    podeVerLista: hasAnyRole(["admin", "staff", "viewer"]),
    podeCriar: hasAnyRole(["admin", "staff"]),
    podeEditar: hasAnyRole(["admin", "staff"]),
    podeDeletar: hasRole("admin"),
  };
};
```

---

## 6. Componentes de UI

### 📁 Pasta: `components/ui/`

Componentes base do design system, estilo **shadcn/ui**. Construídos sobre **Radix UI** + **CVA** + **Tailwind**.

| Componente | Importação | Uso |
|-----------|-----------|-----|
| `Button` | `@/components/ui/button` | Botões com variantes e tamanhos |
| `Input` | `@/components/ui/input` | Campo de texto |
| `Card` | `@/components/ui/card` | Container com borda e sombra |
| `Badge` | `@/components/ui/badge` | Tags e etiquetas |
| `Dialog` | `@/components/ui/dialog` | Modal acessível |
| `Select` | `@/components/ui/select` | Dropdown de seleção |
| `Table` | `@/components/ui/table` | Tabela HTML estilizada |
| `Tabs` | `@/components/ui/tabs` | Navegação em abas |
| `Tooltip` | `@/components/ui/tooltip` | Dica ao passar o mouse |
| `Skeleton` | `@/components/ui/skeleton` | Loading placeholder |
| `Avatar` | `@/components/ui/avatar` | Foto de perfil |
| `Separator` | `@/components/ui/separator` | Linha divisória |

#### Exemplo de uso

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ExemploCard() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Título</h2>
        <Badge variant="secondary">Novo</Badge>
      </CardHeader>
      <CardContent>
        <Input placeholder="Digite algo..." />
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">Cancelar</Button>
        <Button>Confirmar</Button>
      </CardFooter>
    </Card>
  );
}
```

#### Variantes do Button

```tsx
<Button variant="default">Padrão</Button>
<Button variant="destructive">Deletar</Button>
<Button variant="outline">Contorno</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="ghost">Fantasma</Button>
<Button variant="link">Link</Button>

<Button size="sm">Pequeno</Button>
<Button size="default">Médio</Button>
<Button size="lg">Grande</Button>
<Button size="icon"><IconeAqui /></Button>
```

### 📁 Pasta: `components/common/`

Componentes reutilizáveis de nível mais alto:

| Componente | Arquivo | O que faz |
|-----------|---------|-----------|
| `GenericTable` | `GenericTable.tsx` | Tabela configurável por props com paginação |
| `ThemeSwitcher` | `ThemeSwitcher.tsx` | Botão de toggle claro/escuro |
| `ResponsiveModal` | `ResponsiveModal.tsx` | Modal que vira drawer no mobile |

### Utilitário `cn()` — Composição de classes

```typescript
// lib/utils.ts
import { cn } from "@/lib/utils";

// Combina classes condicionalmente sem conflito
<div className={cn(
  "base-class p-4",
  isActive && "bg-blue-500",
  isDisabled && "opacity-50 cursor-not-allowed",
  className // classes externas
)} />
```

---

## 7. Hooks Customizados

### 📁 Pasta: `hooks/`

| Hook | Arquivo | O que resolve |
|------|---------|---------------|
| `useAuth` | `useAuth.ts` | Facade do authStore — acessa estado de autenticação |
| `useAuthGuard` | `useAuthGuard.ts` | Redireciona se não autenticado |
| `useProtectedRoute` | dentro do system | Valida rota protegida no client |
| `useAuthorization` | `useAuthorization.ts` | Verificação de papéis e permissões |
| `useAdminTable` | `useAdminTable.ts` | Lógica completa de tabelas admin |
| `useTableFiltering` | `useTableFiltering.ts` | Filtros e busca por texto |
| `useTablePagination`| `useTablePagination.ts` | Controle de página e tamanho |
| `useTableSorting` | `useTableSorting.ts` | Ordenação por colunas |

### Como criar seu próprio hook de dados

```typescript
// hooks/useProdutos.ts
import { useState, useEffect } from "react";
import { get } from "@/lib/api";
import { Produto } from "@/lib/interfaces/produtoInterfaces";

export function useProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const buscar = async () => {
      try {
        const response = await get<Produto[]>("/v1/produtos");
        setProdutos(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    buscar();
  }, []);

  return { produtos, isLoading, error };
}
```

### Usando o `useAdminTable`

```tsx
import { useAdminTable } from "@/hooks/useAdminTable";
import { GenericTable } from "@/components/common/GenericTable";
import { get } from "@/lib/api";

export default function ListaProdutos() {
  const { data, isLoading, searchTerm, setSearchTerm } = useAdminTable({
    fetchData: () => get("/v1/produtos"),
    searchFields: ["nome", "descricao", "codigo"],
  });

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar..."
      />
      <GenericTable data={data} isLoading={isLoading} />
    </div>
  );
}
```

---

## 8. Formulários e Validação

### Stack de formulários

| Biblioteca | Papel |
|-----------|-------|
| **React Hook Form** | Gerencia o estado do formulário de forma performática |
| **Zod** | Define o schema de validação com tipos TypeScript |

### Padrão de um formulário completo

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 1. Definir o schema de validação
const produtoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  preco: z.number().positive("Preço deve ser positivo"),
  descricao: z.string().optional(),
});

// 2. Inferir o tipo TypeScript do schema
type ProdutoForm = z.infer<typeof produtoSchema>;

export default function FormularioProduto() {
  // 3. Inicializar o hook
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProdutoForm>({
    resolver: zodResolver(produtoSchema),
  });

  // 4. Handler de submit
  const onSubmit = async (data: ProdutoForm) => {
    try {
      await post("/v1/produtos", data);
      reset();
    } catch (err: any) {
      console.error(err.message);
    }
  };

  // 5. Renderizar
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register("nome")} placeholder="Nome do produto" />
      {errors.nome && <span className="text-red-500">{errors.nome.message}</span>}

      <Input {...register("preco", { valueAsNumber: true })} type="number" />
      {errors.preco && <span className="text-red-500">{errors.preco.message}</span>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
```

### Schemas existentes: `lib/validators/`

Os schemas de validação do projeto ficam aqui. Crie um arquivo por entidade:

```
lib/validators/
├── authValidator.ts      → schemas de login, senha
├── usuarioValidator.ts   → schemas de criação/edição de usuário
└── produtoValidator.ts   → (exemplo de como criar)
```

---

## 9. Gerenciamento de Tema

### Implementação: `next-themes` + CSS Variables

O tema claro/escuro é controlado pelo `next-themes`, configurado em `app/providers.tsx`.

As cores usam **variáveis CSS** definidas em `styles/globals.css`:

```css
/* styles/globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

### Como usar as cores do tema no Tailwind

```tsx
// Sempre prefira as classes semânticas do tema:
<div className="bg-background text-foreground">       // muda com o tema
<div className="bg-card text-card-foreground">        // fundo de card
<div className="text-muted-foreground">               // texto secundário
<div className="border-border">                       // bordas
<div className="bg-primary text-primary-foreground">  // cor primária
<div className="bg-destructive">                      // vermelho/erro
```

### Componentes de toggle de tema

```tsx
import { ThemeSwitcher } from "@/components/common/ThemeSwitcher";

// Botão pronto para alternar entre claro/escuro
<ThemeSwitcher />
```

---

## 10. PWA (Progressive Web App)

### 📁 Arquivos relevantes

| Arquivo | Função |
|---------|--------|
| `next.config.js` | Configuração do `next-pwa` e estratégias de cache |
| `public/manifest.json` | Nome, ícones, cores e comportamento do app instalado |
| `public/offline.html` | Página exibida quando não há conexão |
| `public/icons/` | Ícones do app em vários tamanhos (gerados por `generate-icons.sh`) |
| `components/PWAInstallPrompt.tsx` | Banner de instalação para Android e iOS |

### Como o Service Worker funciona

- Em **desenvolvimento**: desabilitado por padrão
- Em **produção** (`npm run build`): gerado automaticamente em `.next/`
- Faz cache de fontes, assets estáticos, páginas visitadas e algumas APIs
- Exibe `public/offline.html` quando não tem conexão

### Gerar ícones PWA

```bash
# Edite o script com o caminho da sua imagem base
./generate-icons.sh
```

---

## 11. Segurança (Middleware e CSP)

### 📁 Arquivo: `middleware.ts`

É executado **antes de toda requisição** no servidor. Responsabilidades:

1. **Proteção de rotas** — verifica token antes de `/sistema/*`
2. **Content Security Policy (CSP)** — define quais origens são permitidas
3. **Headers de segurança** — X-Frame-Options, X-Content-Type-Options, etc.

### Headers aplicados automaticamente

| Header | Proteção |
|--------|----------|
| `X-Frame-Options: DENY` | Impede clickjacking em iframes |
| `X-Content-Type-Options: nosniff` | Impede MIME sniffing |
| `Referrer-Policy` | Controla informações no cabeçalho Referer |
| `Permissions-Policy` | Desabilita câmera, microfone, geolocalização |
| `Content-Security-Policy` | Define origens permitidas para scripts, estilos, etc. |

### Adicionando sua API ao CSP

Ao configurar sua API real, adicione o domínio ao `connectSrc` no `middleware.ts`:

```typescript
// middleware.ts
connectSrc.push(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001");
```

---

## 12. Configuração Global do App

### 📁 Arquivo: `config/site.ts`

Define o nome do sistema, links da navbar e itens de menu. **É o primeiro arquivo a editar** ao criar um novo projeto baseado neste boilerplate.

```typescript
// config/site.ts
export const siteConfig = {
  name: "UniHub",                    // ← Nome do sistema (aparece no header)
  description: "Descrição do app.",  // ← Meta description

  navItems: [                        // ← Links do menu principal
    { label: "Página Inicial", href: "/sistema" },
    { label: "Produtos", href: "/sistema/produtos" },  // ← adicione aqui
  ],

  navMenuItems: [                    // ← Links do menu mobile/dropdown
    { label: "Perfil", href: "/perfil" },
    { label: "Configurações", href: "/configuracoes" },
    { label: "Logout", href: "/logout" },
  ],

  links: {
    instagram: "https://instagram.com/meuapp",
  },
};
```

### 📁 Arquivo: `app/providers.tsx`

Todos os providers globais ficam aqui. Envolve **toda** a aplicação:

```tsx
// app/providers.tsx
export function Providers({ children, themeProps }) {
  return (
    <ThemeProvider {...themeProps}>   {/* next-themes */}
      <Toaster />                     {/* Sonner toast */}
      {children}
    </ThemeProvider>
  );
}
```

Se precisar adicionar novos providers (ex: React Query, SWR), adicione aqui.

### 📁 Arquivo: `.env.example` / `.env.local`

```dotenv
# URL da sua API backend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Paths dos serviços (se usar API Gateway)
NEXT_PUBLIC_AUTH_SERVICE_PATH=/api/v1/user/auth
NEXT_PUBLIC_USER_SERVICE_PATH=/api/v1/users

# Ambiente
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_DEBUG_MODE=true

# PWA
NEXT_PUBLIC_PWA_ENABLED=true

# Timeout das requisições (ms)
NEXT_PUBLIC_API_TIMEOUT=10000
```

---

## 13. Notificações Toast

### Biblioteca: **Sonner** — `app/providers.tsx`

```tsx
import { toast } from "sonner";

// Sucesso
toast.success("Produto salvo com sucesso!");

// Erro
toast.error("Falha ao salvar. Tente novamente.");

// Informação
toast.info("Sincronizando dados...");

// Aviso
toast.warning("Sessão expira em 5 minutos.");

// Toast com promessa (loading automático)
toast.promise(salvarProduto(data), {
  loading: "Salvando...",
  success: "Produto salvo!",
  error: "Erro ao salvar.",
});

// Com ação
toast("Produto deletado", {
  action: {
    label: "Desfazer",
    onClick: () => restaurarProduto(id),
  },
});
```

---

## 14. Build, Lint e Ferramentas

### Scripts disponíveis (`package.json`)

```bash
npm run dev           # Inicia o servidor de desenvolvimento (Turbopack)
npm run dev:debug     # Dev com inspetor Node.js
npm run build         # Build de produção
npm run start         # Serve a build de produção
npm run lint          # ESLint com correção automática
npm run lint:check    # ESLint sem correção
npm run type-check    # TypeScript sem emitir arquivos
npm run clean         # Remove .next/, .turbo/, dist/
```

### Analisar o tamanho do bundle

```bash
ANALYZE=true npm run build
# Abre um relatório visual mostrando o peso de cada dependência
```

### TypeScript — verificar erros sem buildar

```bash
npm run type-check
# Útil antes de abrir um PR
```

---

## 15. Mapa Mental: Como Tudo se Conecta

```
┌─────────────────── REQUISIÇÃO DO USUÁRIO ───────────────────┐
│                                                               │
│   Browser → middleware.ts (CSP + auth check)                 │
│                    ↓                                          │
│            Next.js App Router                                 │
│                    ↓                                          │
│   ┌─────── app/auth/* ──────┐  ┌── app/sistema/* ──────────┐ │
│   │  Páginas públicas       │  │  Páginas protegidas        │ │
│   │  login, esqueci-senha   │  │  SystemLayoutClient        │ │
│   └─────────────────────────┘  │    ↓ useProtectedRoute()  │ │
│                                │  page.tsx                  │ │
│                                └───────────────────────────┘ │
│                                                               │
│   ┌─────────────── CAMADAS DE DADOS ─────────────────────┐   │
│   │                                                       │   │
│   │  Componente                                           │   │
│   │      ↓                                               │   │
│   │  Hook (hooks/)  ←──────→  stores/authStore.ts        │   │
│   │      ↓                    (Zustand + persist)         │   │
│   │  Service (lib/api/services/)                          │   │
│   │      ↓                                               │   │
│   │  lib/api/utils.ts (get/post/put/del)                 │   │
│   │      ↓                                               │   │
│   │  lib/api/client.ts (Axios + interceptadores)         │   │
│   │      ↓                                               │   │
│   │  API Backend (NEXT_PUBLIC_API_URL)                    │   │
│   └───────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

---

## Checklist para iniciar um novo projeto

```
[ ] 1. Copiar .env.example → .env.local e preencher NEXT_PUBLIC_API_URL
[ ] 2. Editar config/site.ts com nome e rotas do sistema
[ ] 3. Implementar stores/authStore.ts → login() e checkAuth()
[ ] 4. Confirmar que lib/api/client.ts usa NEXT_PUBLIC_API_URL
[ ] 5. Atualizar lib/api/index.ts com os paths da nova API
[ ] 6. Atualizar middleware.ts com o domínio da API no connectSrc
[ ] 7. Criar interfaces em lib/interfaces/ para cada entidade
[ ] 8. Criar schemas Zod em lib/validators/ para cada formulário
[ ] 9. Criar serviços em lib/api/services/ para cada recurso
[ ] 10. Criar hooks em hooks/ para cada feature
[ ] 11. Criar páginas em app/sistema/[feature]/page.tsx
[ ] 12. Deletar lib/api/examples.ts
[ ] 13. Rodar npm run type-check antes do primeiro deploy
```

---

> **Dica:** Leia os arquivos nesta ordem para entender o projeto rapidamente:
> 1. `stores/authStore.ts`
> 2. `lib/api/client.ts`
> 3. `middleware.ts`
> 4. `app/sistema/SystemLayoutClient.tsx`
> 5. `config/site.ts`