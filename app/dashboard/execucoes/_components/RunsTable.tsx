// Tabela de execucoes com 3 estados: loading (spinner), vazio e dados.
// Usa useRouter do Next.js para navegar ao clicar em uma linha.

"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { GlassCard } from "../../projetos/_components/GlassBackground";
import RunsTableRow from "./RunsTableRow";
import type { TestRun } from "@/lib/api/runs";

interface RunsTableProps {
  runs: TestRun[];
  isLoading: boolean;
}

const HEADERS = [
  { label: "Execucao / Projeto", className: "" },
  { label: "Branch",             className: "hidden md:table-cell" },
  { label: "Status",             className: "" },
  { label: "Pass Rate",          className: "hidden lg:table-cell" },
  { label: "Testes",             className: "hidden md:table-cell" },
  { label: "Duracao",            className: "hidden lg:table-cell" },
  { label: "Iniciado em",        className: "" },
  { label: "",                   className: "w-8" },
];

export function RunsTable({ runs, isLoading }: RunsTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#3B82F6" }} />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center py-20 gap-3">
        <span className="text-4xl" aria-hidden="true">▶️</span>
        <p className="text-sm font-medium" style={{ color: "var(--col-muted)" }}>
          Nenhuma execucao encontrada
        </p>
        <p className="text-xs" style={{ color: "var(--col-dim)" }}>
          Tente ajustar os filtros ou inicie uma nova execucao
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Lista de execucoes">
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--glass-inner-border)",
                background: "var(--glass-card-header)",
              }}
            >
              {HEADERS.map((h, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-left text-xs font-semibold ${h.className}`}
                  style={{ color: "var(--col-label)" }}
                  scope="col"
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <RunsTableRow
                key={run.id}
                run={run}
                onClick={() => router.push(`/dashboard/execucoes/${run.id}`)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
