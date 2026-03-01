// =============================================================================
// CONCEITO 1: Por que este arquivo NÃO tem "use client"?
//
// No Next.js App Router, layouts podem ser Server ou Client Components.
// A regra: prefira Server Component a menos que precise de interatividade.
//
// Este arquivo é Server Component porque só precisa de:
//   1. Exportar metadata (só funciona em Server Components)
//   2. Passar children para DashboardLayoutClient
//
// A lógica interativa (useProtectedRoute, Navbar, estado) fica no
// DashboardLayoutClient, que é Client Component ("use client").
//
// Por que separar em dois arquivos?
//   → metadata só pode ser exportado de Server Components
//   → useProtectedRoute (hook) só funciona em Client Components
//   → Se misturássemos num só arquivo, teríamos que abrir mão de um
//
// Paralelo Django: é como separar os decorators/configurações da view
// do template que ela renderiza — cada responsabilidade no lugar certo.
// =============================================================================

import { Metadata } from "next";

import DashboardLayoutClient from "./DashboardLayoutClient";

// Metadata herdado por TODAS as páginas dentro de /dashboard/
// a menos que uma página específica exporte seu próprio metadata.
export const metadata: Metadata = {
  title: "Dashboard",
  description: "TJGOHub — Playwright Results Hub",
};

// =============================================================================
// CONCEITO 2: Layout como "casca" que persiste entre navegações
//
// Hierarquia do dashboard:
//   DashboardLayout (este arquivo — Server)
//   └── DashboardLayoutClient (Navbar + proteção de rota — Client)
//       └── children (a página: /dashboard/casos, /dashboard/projetos...)
//
// Quando o usuário navega de /dashboard/casos para /dashboard/projetos,
// o layout NÃO é re-renderizado — só o children muda.
// A Navbar fica no lugar, o estado se mantém. Muito mais eficiente
// do que o Django que re-renderiza o template inteiro a cada request.
// =============================================================================
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Apenas delega para o Client Component, passando os children adiante
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
