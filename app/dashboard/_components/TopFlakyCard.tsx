// =============================================================================
// CONCEITO 4: Lógica de apresentação dentro do .map()
//
// Às vezes precisamos calcular valores POR ITEM da lista, não globalmente.
// A solução é colocar a lógica dentro do .map() com corpo (chaves + return):
//
//   // Retorno implícito (só JSX):
//   items.map((item) => <li>{item.name}</li>)
//
//   // Corpo com lógica antes do return:
//   items.map((item) => {
//     const rate = Math.round((item.failures / item.total_runs) * 100);
//     return <li style={{ color: rate > 50 ? 'red' : 'orange' }}>{item.name}</li>;
//   })
//
// FONTE DOS DADOS (Passo 6):
//   O backend já tem PATCH /api/v1/results/{id}/mark-as-flaky/ para marcar
//   um resultado individual como flaky. Para listar os "top flaky", no Passo 6
//   consultaremos GET /api/v1/runs/{id}/results/ filtrando por status=FLAKY
//   e agregaremos por caso de teste para montar este ranking.
// =============================================================================

import { Zap } from "lucide-react";

export interface FlakyItem {
  name: string;
  failures: number;    // quantas vezes foi flaky
  total_runs: number;  // em quantas runs o teste apareceu
}

interface TopFlakyCardProps {
  flaky: FlakyItem[];
}

export function TopFlakyCard({ flaky }: TopFlakyCardProps) {
  const MAX_ITEMS = 5;

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      {/* Cabeçalho com ícone de raio */}
      <div className="flex items-center gap-2">
        <Zap size={14} className="text-yellow-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Top Flaky Tests
        </span>
      </div>

      {/* Lista com lógica de cálculo por item */}
      <ul className="space-y-2.5 flex-1">
        {flaky.slice(0, MAX_ITEMS).map((item) => {
          // Taxa de flakiness calculada por item — não dá para fazer fora do map
          const rate = Math.round((item.failures / item.total_runs) * 100);

          // Cor varia conforme gravidade: ≥50% = vermelho, <50% = amarelo
          const style =
            rate >= 50
              ? { background: "#fee2e2", color: "#dc2626" }
              : { background: "#fef9c3", color: "#ca8a04" };

          return (
            <li key={item.name} className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate" title={item.name}>
                  {item.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.failures} falhas em {item.total_runs} runs
                </p>
              </div>

              {/* Badge com % de flakiness */}
              <span
                className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold mt-0.5"
                style={style}
              >
                {rate}%
              </span>
            </li>
          );
        })}

        {flaky.length === 0 && (
          <li className="text-sm text-gray-400 text-center py-6">
            Nenhum teste instável
          </li>
        )}
      </ul>
    </div>
  );
}
