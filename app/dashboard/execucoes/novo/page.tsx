// =============================================================================
// Página "Nova Execução" — /execucoes/novo
//
// Server Component simples: só define metadata e renderiza o Client Component.
// Toda a lógica interativa fica no NovoRunClient (marcado com "use client").
//
// Por que separar Server e Client Components?
//   Server Components rodam no servidor (sem JS no browser) — bons para
//   buscar dados, definir metadata, renderizar HTML estático.
//   Client Components rodam no browser — necessários para useState, useEffect,
//   event handlers e qualquer interação do usuário.
// =============================================================================

import type { Metadata } from "next";
import { NovoRunClient } from "./_components/NovoRunClient";

export const metadata: Metadata = {
  title: "Nova Execução | TJGOHub",
};

export default function NovoExecucaoPage() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "#8d9bac", marginBottom: 6 }}>
        <a href="/dashboard/execucoes" style={{ color: "#2563eb", textDecoration: "none" }}>
          Execuções
        </a>
        {" / Nova Execução"}
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2332", marginBottom: 24 }}>
        Nova Execução
      </h1>

      <NovoRunClient />
    </div>
  );
}
