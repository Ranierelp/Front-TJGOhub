// 4 cards de metricas no topo da listagem de execucoes.
// Os valores sao calculados da lista atual retornada pela API.

import { GlassCard } from "../../projetos/_components/GlassBackground";
import type { TestRun } from "@/lib/api/runs";

interface RunsStatsCardsProps {
  runs: TestRun[];
  total: number;   // total geral (da paginacao), nao so da pagina atual
}

function StatCard({
  emoji,
  value,
  label,
}: {
  emoji: string;
  value: number;
  label: string;
}) {
  return (
    <GlassCard className="p-4 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
        style={{
          background:
            "linear-gradient(135deg,rgba(219,234,254,0.8),rgba(191,219,254,0.5))",
        }}
      >
        {emoji}
      </div>
      <div>
        <p
          className="text-2xl font-extrabold leading-none tabular-nums"
          style={{ color: "var(--col-heading)" }}
        >
          {value}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--col-dim)" }}>
          {label}
        </p>
      </div>
    </GlassCard>
  );
}

export function RunsStatsCards({ runs, total }: RunsStatsCardsProps) {
  // Conta por status na pagina atual (rapido, sem requisicao extra)
  const completed = runs.filter((r) => r.status === "COMPLETED").length;
  const failed    = runs.filter((r) => r.status === "FAILED").length;
  const cancelled = runs.filter((r) => r.status === "CANCELLED").length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard emoji="▶️" value={total}     label="Total de Execucoes" />
      <StatCard emoji="✅" value={completed} label="Concluidas"         />
      <StatCard emoji="❌" value={failed}    label="Com Falha"          />
      <StatCard emoji="⊗"  value={cancelled} label="Canceladas"        />
    </div>
  );
}
