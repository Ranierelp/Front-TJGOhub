// =============================================================================
// WorkloadCard — Faixa 3, coluna 3: carga de falhas por responsável
//
// Responde: "quem no meu time está com mais problemas na mão?"
// Cada item = um responsável (assigned_to do TestCase) e quantos casos
// DISTINTOS dele tiveram falha no período. Serve para o QA lead realocar
// prioridade ou dar suporte a quem está sobrecarregado.
//
// A barra é proporcional ao MAIOR valor da lista (não a 100%): o primeiro
// da lista sempre tem barra cheia e os demais são relativos a ele.
// =============================================================================

import { Users } from "lucide-react";
import type { WorkloadItem } from "@/lib/api/metrics";

interface WorkloadCardProps {
  workload: WorkloadItem[];
}

export function WorkloadCard({ workload }: WorkloadCardProps) {
  // Denominador das barras: o maior count da lista (mínimo 1 p/ evitar 0/0)
  const maior = Math.max(1, ...workload.map((item) => item.count));

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 flex flex-col gap-3"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center gap-2">
        <Users size={14} className="text-blue-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wide">
          Carga por Responsável
        </span>
      </div>

      <ul className="space-y-2.5 flex-1">
        {workload.map((item) => (
          // key: nome ou o rótulo de "sem responsável" — únicos na lista,
          // pois o backend agrupa por responsável (1 linha por pessoa)
          <li key={item.assignee ?? "__sem__"}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <p
                className={`text-sm truncate ${
                  item.assignee
                    ? "text-gray-700 dark:text-slate-300"
                    : "text-gray-400 dark:text-slate-500 italic"
                }`}
                title={item.assignee ?? "Casos sem responsável definido"}
              >
                {item.assignee ?? "Sem responsável"}
              </p>
              <span className="flex-shrink-0 text-xs font-bold text-gray-600 dark:text-slate-300">
                {item.count}
              </span>
            </div>
            {/* Barra relativa ao maior da lista */}
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${(item.count / maior) * 100}%` }}
              />
            </div>
          </li>
        ))}

        {workload.length === 0 && (
          <li className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">
            Nenhum caso com falha no período
          </li>
        )}
      </ul>
    </div>
  );
}
