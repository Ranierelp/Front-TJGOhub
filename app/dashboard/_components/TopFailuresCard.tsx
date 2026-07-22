// =============================================================================
// TopFailuresCard — Faixa 3, coluna 1: falhas mais recorrentes do período
//
// Evolução (redesign): cada item agora traz a PRIORIDADE do caso vinculado
// (badge colorido) e, quando há caso cadastrado, o título vira LINK para
// /dashboard/casos/{id}. O QA lead vê na hora se as falhas recorrentes são
// em funcionalidade crítica ou secundária.
//
// O tipo TopFailure vem de lib/api/metrics.ts — o hook e este card importam
// do mesmo lugar (hierarquia lib → hooks → app respeitada).
// =============================================================================

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import type { TopFailure } from "@/lib/api/metrics";

interface TopFailuresCardProps {
  failures: TopFailure[];
}

// Cores dos badges de prioridade — CRITICAL/HIGH gritam, MEDIUM/LOW discretos
const BADGE_PRIORIDADE: Record<string, { bg: string; cor: string; rotulo: string }> = {
  CRITICAL: { bg: "#fee2e2", cor: "#dc2626", rotulo: "CRÍTICO" },
  HIGH:     { bg: "#ffedd5", cor: "#ea580c", rotulo: "ALTO" },
  MEDIUM:   { bg: "#f3f4f6", cor: "#6b7280", rotulo: "MÉDIO" },
  LOW:      { bg: "#f3f4f6", cor: "#9ca3af", rotulo: "BAIXO" },
};

export function TopFailuresCard({ failures }: TopFailuresCardProps) {
  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 flex flex-col gap-3"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center gap-2">
        <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wide">
          Top Falhas do Período
        </span>
      </div>

      <ul className="space-y-2.5 flex-1">
        {failures.map((item) => {
          const badge = item.priority ? BADGE_PRIORIDADE[item.priority] : null;

          // Título com ou sem link — só casos CADASTRADOS têm página de detalhe
          const titulo = item.case_id ? (
            <Link
              href={`/dashboard/casos/${item.case_id}`}
              className="text-sm text-gray-700 dark:text-slate-300 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title={item.title}
            >
              {item.title}
            </Link>
          ) : (
            <p className="text-sm text-gray-700 dark:text-slate-300 truncate" title={item.title}>
              {item.title}
            </p>
          );

          return (
            <li key={`${item.title}-${item.case_id}`} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Badge de prioridade — só quando o resultado tem caso vinculado */}
                {badge && (
                  <span
                    className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{ background: badge.bg, color: badge.cor }}
                  >
                    {badge.rotulo}
                  </span>
                )}
                {titulo}
              </div>

              <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                {item.count}x
              </span>
            </li>
          );
        })}

        {failures.length === 0 && (
          <li className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">
            Nenhuma falha registrada
          </li>
        )}
      </ul>
    </div>
  );
}
