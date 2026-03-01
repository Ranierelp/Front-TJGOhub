// =============================================================================
// CONCEITO 6: Server Component como "orquestrador" da página
//
// Este arquivo NÃO tem "use client" — continua sendo um Server Component.
// Ele roda no SERVIDOR, renderiza o shell estático (título, layout) e
// entrega o <DashboardClient> para o browser completar com os dados reais.
//
// Responsabilidades DESTE arquivo:
//   1. Definir o layout da página (título + espaçamento)
//   2. Renderizar o <DashboardClient> como filho
//
// Responsabilidades do DashboardClient:
//   1. Buscar dados reais da API (useDashboardData)
//   2. Gerenciar estados de loading/error
//   3. Renderizar os cards com dados reais
//
// Por que separar assim?
//   O título e o layout da página chegam no HTML inicial (Server).
//   Os dados chegam logo depois via fetch no Client.
//   O usuário vê a página se formar progressivamente — não fica com tela
//   branca esperando todos os dados carregarem antes de ver qualquer coisa.
//
// Paralelo Django: é como ter uma view que renderiza o template com
// contexto básico, e um <script> que faz AJAX para carregar o conteúdo.
// =============================================================================

import { DashboardClient } from "./_components/DashboardClient";

export default function DashboardPage() {
  return (
    // max-w-7xl: limita a largura em telas muito grandes — igual ao Navbar
    // space-y-5: espaçamento vertical entre seções (título, cards, gráfico)
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

      {/* Título da página — renderizado no servidor (sem fetch) */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral das execuções de teste</p>
      </div>

      {/* DashboardClient: Client Component que busca os dados reais da API */}
      <DashboardClient />

    </div>
  );
}
