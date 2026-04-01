// Server Component — wrapper da pagina de listagem de execucoes.
// Toda a logica interativa esta no RunsClient (Client Component).

import { RunsClient } from "./_components/RunsClient";

export default function ExecucoesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <RunsClient />
    </div>
  );
}
