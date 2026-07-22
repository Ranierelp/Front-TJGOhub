// =============================================================================
// TopFlakyCard — Faixa 3, coluna 2: testes mais instáveis do período
//
// Evolução (redesign): o texto "6 falhas em 9 runs" virou uma BARRA horizontal
// com o percentual de instabilidade — muito mais rápido de comparar entre
// itens de relance. A taxa já vem calculada do backend (rate 0-100).
//
// Barra ≥ 50% = vermelha (teste não confiável); < 50% = âmbar (atenção).
// =============================================================================

import { Zap } from "lucide-react";
import type { TopFlaky } from "@/lib/api/metrics";

interface TopFlakyCardProps {
  flaky: TopFlaky[];
}

export function TopFlakyCard({ flaky }: TopFlakyCardProps) {
  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 flex flex-col gap-3"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center gap-2">
        <Zap size={14} className="text-yellow-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wide">
          Top Testes Instáveis
        </span>
      </div>

      <ul className="space-y-3 flex-1">
        {flaky.map((item) => {
          const cor = item.rate >= 50 ? "#dc2626" : "#ca8a04";

          return (
            <li key={item.title}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p
                  className="text-sm text-gray-700 dark:text-slate-300 truncate flex-1"
                  title={`${item.title} — ${item.flaky_count} instáveis em ${item.total} execuções`}
                >
                  {item.title}
                </p>
                <span className="flex-shrink-0 text-xs font-bold" style={{ color: cor }}>
                  {item.rate.toFixed(0)}%
                </span>
              </div>

              {/* Barra de instabilidade — largura = taxa de flakiness */}
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.rate}%`, background: cor }}
                />
              </div>
            </li>
          );
        })}

        {flaky.length === 0 && (
          <li className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">
            Nenhum teste instável
          </li>
        )}
      </ul>
    </div>
  );
}
