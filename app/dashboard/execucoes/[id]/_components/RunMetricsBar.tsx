// Pills clicaveis de metricas — ao clicar filtra os resultados abaixo.
// O pill ativo fica com background solido (cor do status),
// o inativo fica com o background claro (bg do badge).

import type { TestRunDetail } from "@/lib/api/runs";
import type { ResultStatusFilter } from "@/hooks/useRunDetail";

interface RunMetricsBarProps {
  run: TestRunDetail;
  activeFilter: ResultStatusFilter;
  onFilter: (f: ResultStatusFilter) => void;
}

interface MetricPillProps {
  label: string;
  count: number;
  color: string;
  bg: string;
  active: boolean;
  onClick: () => void;
}

function MetricPill({ label, count, color, bg, active, onClick }: MetricPillProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{
        color:      active ? "white" : color,
        background: active ? color   : bg,
        border:     `1px solid ${active ? color : "transparent"}`,
        transform:  active ? "scale(1.02)" : "none",
      }}
    >
      <span className="tabular-nums">{count}</span>
      <span>{label}</span>
    </button>
  );
}

export function RunMetricsBar({ run, activeFilter, onFilter }: RunMetricsBarProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar resultados por status">
      <MetricPill
        label="Total"   count={run.total_tests}   color="#2563eb" bg="#eff6ff"
        active={activeFilter === "all"}     onClick={() => onFilter("all")}
      />
      <MetricPill
        label="Passou"  count={run.passed_tests}  color="#16a34a" bg="#dcfce7"
        active={activeFilter === "PASSED"}  onClick={() => onFilter("PASSED")}
      />
      <MetricPill
        label="Falhou"  count={run.failed_tests}  color="#dc2626" bg="#fee2e2"
        active={activeFilter === "FAILED"}  onClick={() => onFilter("FAILED")}
      />
      <MetricPill
        label="Flaky"   count={run.flaky_tests}   color="#ca8a04" bg="#fef9c3"
        active={activeFilter === "FLAKY"}   onClick={() => onFilter("FLAKY")}
      />
      <MetricPill
        label="Pulado"  count={run.skipped_tests} color="#64748b" bg="#f1f5f9"
        active={activeFilter === "SKIPPED"} onClick={() => onFilter("SKIPPED")}
      />
    </div>
  );
}
