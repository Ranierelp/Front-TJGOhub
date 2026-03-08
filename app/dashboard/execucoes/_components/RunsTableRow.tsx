// Linha individual da tabela de execucoes.
// Extraida do RunsTable para React.memo — evita re-render de todas as linhas
// quando so uma run muda (ou quando filtros mudam mas a lista nao).
//
// React.memo: funciona como shouldComponentUpdate do React classico —
//   so re-renderiza se as props mudarem. Otimo para listas longas.

import React from "react";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { PassRateBar } from "./PassRateBar";
import type { TestRun } from "@/lib/api/runs";

interface RunsTableRowProps {
  run: TestRun;
  onClick: () => void;
}

function RunsTableRow({ run, onClick }: RunsTableRowProps) {
  const date = run.started_at
    ? new Date(run.started_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <tr
      onClick={onClick}
      className="border-b cursor-pointer transition-colors"
      style={{ borderColor: "var(--glass-inner-border)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background =
          "rgba(37,99,235,0.03)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
      }}
    >
      {/* Execucao / Projeto */}
      <td className="px-4 py-3">
        <p className="text-sm font-semibold" style={{ color: "var(--col-heading)" }}>
          {run.run_id}
        </p>
        <p className="text-xs" style={{ color: "var(--col-dim)" }}>
          {run.project_name}
        </p>
      </td>

      {/* Branch (oculta em mobile) */}
      <td className="px-4 py-3 hidden md:table-cell">
        <span
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={{
            background: "var(--glass-field-bg)",
            color: "var(--col-muted)",
          }}
        >
          {run.branch || "—"}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={run.status} />
      </td>

      {/* Pass Rate (oculta em tablet) */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="w-32">
          <PassRateBar rate={run.success_rate ?? 0} />
        </div>
      </td>

      {/* Contagem de testes (oculta em mobile) */}
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="flex gap-2 text-xs">
          <span style={{ color: "#16a34a" }}>✓ {run.passed_tests}</span>
          <span style={{ color: "#dc2626" }}>✕ {run.failed_tests}</span>
          <span style={{ color: "#ca8a04" }}>◐ {run.flaky_tests}</span>
        </div>
      </td>

      {/* Duracao (oculta em tablet) */}
      <td
        className="px-4 py-3 hidden lg:table-cell text-xs"
        style={{ color: "var(--col-dim)" }}
      >
        {run.duration_formatted ?? "—"}
      </td>

      {/* Data */}
      <td className="px-4 py-3 text-xs" style={{ color: "var(--col-dim)" }}>
        {date}
      </td>

      {/* Seta de navegacao */}
      <td className="px-4 py-3">
        <ChevronRight size={16} style={{ color: "var(--col-dim)" }} aria-hidden="true" />
      </td>
    </tr>
  );
}

export default React.memo(RunsTableRow);
