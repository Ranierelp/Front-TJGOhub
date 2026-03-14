// Server Component — wrapper da pagina de detalhe de uma execucao.
// Next.js 15: params e uma Promise em server components (precisa de await).

import { RunDetailClient } from "./_components/RunDetailClient";

export default async function ExecucaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <RunDetailClient runId={id} />
    </div>
  );
}
