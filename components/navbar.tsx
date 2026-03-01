"use client";

import React from "react";
import NextLink from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Settings, LayoutDashboard, Menu, X, Bell } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { siteConfig } from "@/config/site";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Escudo TJGO inline — mesmo path do favicon (app/icon.svg).
// SVG inline permite controlar cor via props; impossível com <img src="..."/>.
function TjgoShield() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={32} height={32} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.15)" />
      <path
        d="M16 26s8-4 8-10V9l-8-3-8 3v7c0 6 8 10 8 10z"
        fill="white" stroke="white" strokeWidth="0.5"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

// =============================================================================
// CONCEITO 1: Arrow function como componente
//
// Há duas sintaxes válidas para definir componentes em React:
//
//   1. function declaration (usada nos outros arquivos):
//      export default function LoginPage() { ... }
//
//   2. arrow function (usada aqui):
//      export const Navbar = () => { ... }
//
// São funcionalmente idênticas para componentes. A diferença é que
// arrow function não tem hoisting — não pode ser usada antes de ser
// declarada no arquivo. A preferência é estilo de equipe.
// =============================================================================
export const Navbar = () => {

  // =========================================================================
  // CONCEITO 2: Dados do usuário vindos da store global
  //
  // useAuth() é o hook que lê da authStore — retorna os dados de leitura:
  //   user          → dados do usuário logado (nome, email, avatar, roles...)
  //   isAuthenticated → boolean
  //   logout        → função para deslogar
  //
  // Nota: useAuth() vem de hooks/useAuth.ts, que é um wrapper de useAuthStore
  // com seletores estáveis — evita re-renders desnecessários.
  // =========================================================================
  const { user, isAuthenticated, logout } = useAuth();

  // useRouter: hook do Next.js para navegação programática (sem clicar em link).
  // Aqui usado no handleSignOut para redirecionar após logout.
  // Paralelo Django: como HttpResponseRedirect mas no lado do cliente.
  const router = useRouter();

  // usePathname: retorna a rota atual como string, ex: "/dashboard/execucoes".
  // Usado para destacar o link ativo no subnav (aba com borda azul embaixo).
  // Paralelo Django: request.path — o caminho da URL atual.
  const pathname = usePathname();

  // Estado local: controla se o menu mobile (hamburguer) está aberto ou fechado
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // =========================================================================
  // CONCEITO 3: Funções auxiliares dentro do componente
  //
  // handleSignOut: função async que:
  //   1. Chama logout() da store (limpa token, estado, blacklist no servidor)
  //   2. Redireciona para login com router.push()
  //
  // Por que não usar <Link href="/auth/login"> direto?
  // Porque precisamos ESPERAR o logout terminar antes de redirecionar.
  // Com onClick={handleSignOut} controlamos o timing manualmente.
  // =========================================================================
  const handleSignOut = async () => {
    await logout();
    router.push("/auth/login/");
  };

  // =========================================================================
  // CONCEITO 4: Estado derivado — calculando valores a partir de dados
  //
  // "initials" não é um estado (não muda independentemente) — é um valor
  // calculado a partir de "user". Quando user mudar, initials é recalculado
  // automaticamente no próximo render.
  //
  // user?.firstName?.[0]  → primeiro caractere do firstName (se existir)
  // || user?.username?.[0] → fallback: primeiro caractere do username
  // || "U"                → fallback final: letra U de "Usuário"
  //
  // Paralelo Python: é como uma @property que recalcula baseada em self.user
  // =========================================================================
  const initials = user
    ? (user.firstName?.[0] || user.username?.[0] || "U").toUpperCase()
    : "U";

  // Checa se o usuário tem papel de admin ou staff para mostrar o painel admin
  const isAdminOrStaff =
    user?.roles?.includes("admin") || user?.roles?.includes("staff");

  return (
    // Wrapper sticky: as DUAS barras (azul + branca) grudam juntas no topo.
    // Sem o wrapper, só a barra azul ficaria fixa e o subnav rolaria com a página.
    <div className="sticky top-0 z-20 w-full"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
    >

      {/* ── BARRA SUPERIOR (azul) ──────────────────────────────────────── */}
      <nav
        style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center px-6 h-14 gap-3">

          {/* Botão hamburguer — visível só em mobile (sm:hidden) */}
          <button
            aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
            className="sm:hidden p-1 rounded-md text-blue-100 hover:text-white hover:bg-blue-700/50"
            onClick={() => setIsMenuOpen((v) => !v)}
          >
            {/* Ícone muda entre X e Menu dependendo do estado */}
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* ── BRAND: escudo + TJGO (negrito) + subtítulo (suave) ── */}
          <NextLink className="flex items-center gap-3" href="/dashboard">
            <TjgoShield />
            <span className="font-bold text-white text-base tracking-tight">TJGO</span>
            <span className="hidden sm:inline text-white/75 text-sm font-normal">
              Playwright Results Hub
            </span>
          </NextLink>

          {/* ── ACTIONS (bell + avatar) — empurrados para a direita com ml-auto ── */}
          <div className="ml-auto flex items-center gap-2">

            {/* Sino de notificações — estático por enquanto */}
            <button
              aria-label="Notificações"
              className="w-9 h-9 rounded-full flex items-center justify-center
                         text-white/80 hover:text-white hover:bg-white/15 transition-colors"
            >
              <Bell size={18} />
            </button>

            {/*
              CONCEITO 6: Renderização condicional com &&

              {isAuthenticated && user && <DropdownMenu>}
              → só renderiza o dropdown se o usuário estiver autenticado E
                os dados do usuário já tiverem sido carregados.

              A segunda condição (user &&) evita erros de "Cannot read
              properties of null" caso isAuthenticated seja true mas user
              ainda esteja null (durante carregamento inicial).
            */}
            {isAuthenticated && user && (
              /*
                CONCEITO 7: DropdownMenu — componente composto do Radix UI

                É outro exemplo do padrão de Compound Components:
                  <DropdownMenu>              → container/contexto
                    <DropdownMenuTrigger>    → o elemento que abre (avatar)
                    <DropdownMenuContent>    → o painel que aparece
                      <DropdownMenuLabel>   → texto não clicável
                      <DropdownMenuSeparator> → linha divisória
                      <DropdownMenuItem>    → item clicável
                    </DropdownMenuContent>
                  </DropdownMenu>

                O Radix gerencia acessibilidade (ARIA), foco com teclado,
                posicionamento e animação automaticamente.
              */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {/* asChild: o button "empresta" o comportamento de trigger para o Avatar */}
                  <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
                    <Avatar className="h-9 w-9 cursor-pointer border-2 border-white/30">
                      {/* AvatarImage: tenta carregar a foto do usuário */}
                      <AvatarImage alt={user.username} src={user.avatar || ""} />
                      {/* AvatarFallback: mostra as iniciais se a imagem falhar */}
                      <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-52">
                  {/* Cabeçalho com info do usuário — não é clicável */}
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-xs text-muted-foreground">Logado como</p>
                    <p className="truncate text-sm font-semibold">
                      {user.email || user.username}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Item de admin — só aparece para admin/staff */}
                  {isAdminOrStaff && (
                    <DropdownMenuItem onClick={() => router.push("/dashboard/configuracoes")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Painel Administrativo
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={() => router.push("/dashboard/configuracoes")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Item de logout com estilo vermelho */}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </nav>

      {/* ── SUBNAV (branco) — links de seção com aba ativa ────────────── */}
      {/*
        CONCEITO 5: Renderizando listas com .map() + lógica de aba ativa

        Novidade em relação ao .map() simples: agora calculamos "isActive"
        por item, para aplicar o estilo de destaque na aba atual.

        usePathname() retorna ex: "/dashboard/execucoes"
        item.href = "/dashboard/execucoes"

        Lógica de match:
          - /dashboard → só ativo se pathname === "/dashboard" (evita
            que "Dashboard" fique ativo em TODAS as sub-rotas do dashboard)
          - demais → ativo se pathname começa com item.href
            ex: "/dashboard/execucoes/123".startsWith("/dashboard/execucoes")

        Paralelo Django: {% if request.path == item.href %}class="active"{% endif %}
      */}
      <div className="hidden sm:block bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center gap-1">
            {siteConfig.navItems.map((item) => {
              // Lógica de aba ativa — explicada no CONCEITO 5 acima
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <NextLink
                  key={item.href}
                  href={item.href}
                  className={[
                    "px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    isActive
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-500 border-transparent hover:text-blue-600 hover:border-blue-300",
                  ].join(" ")}
                >
                  {item.label}
                </NextLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MENU MOBILE ─────────────────────────────────────────────────── */}
      {/*
        Só renderiza se isMenuOpen=true.
        hidden sm:block no subnav esconde os links desktop em mobile.
        Este bloco aparece abaixo da barra azul quando o hamburguer é clicado.
      */}
      {isMenuOpen && (
        <div className="sm:hidden bg-white border-b border-gray-200 px-4 py-2 space-y-0.5">
          {siteConfig.navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <NextLink
                key={item.href}
                href={item.href}
                className={[
                  "block text-sm py-2.5 px-2 rounded-md font-medium transition-colors",
                  isActive
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-blue-600",
                ].join(" ")}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </NextLink>
            );
          })}
        </div>
      )}
    </div>
  );
};
