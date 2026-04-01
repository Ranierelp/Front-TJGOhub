// =============================================================================
// CONCEITO: Server Component — a "view" do Next.js App Router
//
// Este arquivo NÃO tem "use client" no topo.
// Isso significa que ele é um "Server Component" — roda APENAS no servidor.
//
// Por que isso importa?
//   • Mais rápido: o HTML já vem pronto do servidor (não precisa do browser)
//   • Mais seguro: não expõe lógica sensível ao cliente
//   • Mais simples: sem useState, sem eventos de clique aqui
//
// Paralelo Django:
//   Este arquivo  →  como a função view no views.py
//   O CaseDetailClient →  como o template HTML (onde está o "visual")
//
// A pasta "_components" (com underscore) é uma convenção do Next.js para
// dizer "estes arquivos não são rotas — são só componentes internos".
// =============================================================================

// =============================================================================
// CONCEITO: Parâmetros de rota dinâmica
//
// O nome da pasta é [id] — os colchetes indicam uma rota dinâmica.
// É o equivalente de:
//   Django:  path('casos/<uuid:pk>/', views.caso_detalhe)
//   Next.js: app/dashboard/casos/[id]/page.tsx
//
// O Next.js passa o valor do [id] para o componente via a prop "params".
// No Passo 3, vamos usar esse id para buscar o caso correto na API:
//   GET /api/v1/test-cases/{id}/
// =============================================================================
import { CaseDetailClient } from "./_components/CaseDetailClient";

// Next.js 15: params é uma Promise em server components (precisa de await).
export default async function CasoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <CaseDetailClient id={id} />
    </div>
  );
}
