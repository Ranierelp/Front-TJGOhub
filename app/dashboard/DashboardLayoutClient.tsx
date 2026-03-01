"use client";

// =============================================================================
// CONCEITO 1: Par Client do layout Server
//
// Este arquivo é o "par" de layout.tsx — enquanto layout.tsx é Server
// Component (exporta metadata), este é Client Component (usa hooks).
//
// Separar em dois arquivos permite ter o melhor dos dois mundos:
//   layout.tsx              → metadata (só funciona em Server Component)
//   DashboardLayoutClient   → useProtectedRoute (só funciona em Client Component)
//
// Paralelo Django: é como separar o @login_required (lógica) do
// base.html (estrutura) — cada um no lugar certo.
// =============================================================================

import React from "react";

import { useProtectedRoute } from "@/hooks/useAuthGuard";
import { Navbar } from "@/components/navbar";

// =============================================================================
// CONCEITO 2: Proteção de rota no nível do layout
//
// Em vez de proteger cada página individualmente (o que geraria repetição),
// protegemos o LAYOUT. Qualquer rota dentro de /dashboard/ herda
// essa proteção automaticamente — incluindo /dashboard/casos,
// /dashboard/projetos, /dashboard/execucoes, etc.
//
// O fluxo tem 3 estados:
//   1. isLoading=true   → verificando o token (mostra mensagem)
//   2. !isAuthenticated → token inválido/ausente (hook redireciona para login)
//   3. isAuthenticated  → renderiza Navbar + conteúdo + footer
// =============================================================================
export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useProtectedRoute();

  // Estado 1: verificando autenticação — não mostra conteúdo ainda
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">Verificando autenticação...</div>
      </div>
    );
  }

  // Estado 2: não autenticado — retorna null porque o hook já está redirecionando.
  // null em JSX = renderiza absolutamente nada.
  // Evita flash de conteúdo protegido enquanto o redirect acontece.
  if (!isAuthenticated) {
    return null;
  }

  // Estado 3: autenticado — layout completo
  return (
    // =========================================================================
    // CONCEITO 3: Layout com flex-col + flex-grow
    //
    // "flex flex-col h-screen" → coluna vertical que ocupa 100% da tela
    //
    // Distribuição dos filhos:
    //   <Navbar />              → altura natural (auto)
    //   <main className="flex-grow"> → ocupa TODO o espaço que sobra
    //   <footer>                → altura natural (auto)
    //
    // flex-grow faz o <main> se expandir para preencher o espaço entre
    // Navbar e footer — funciona igual a grid-template-rows: auto 1fr auto.
    // =========================================================================
    <div className="relative flex flex-col h-screen">
      <Navbar />

      {/* children = a página do dashboard que está sendo visitada */}
      <main className="flex-grow bg-background">{children}</main>

      <footer className="text-muted-foreground text-sm text-center py-4 border-t border-border">
        {/* new Date().getFullYear() = ano atual dinâmico. Django: {{ now.year }} */}
        © {new Date().getFullYear()} TJGOHub — Playwright Results Hub. Todos os
        direitos reservados.
      </footer>
    </div>
  );
}
