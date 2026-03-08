// =============================================================================
// Configuracao central de status
//
// Por que centralizar aqui?
//   Se cada componente tivesse suas proprias cores e labels, uma mudanca
//   de cor exigiria editar 5+ arquivos. Aqui, edita-se em um so lugar.
//
// Paralelo Django: equivalente a ter choices = [...] no modelo —
//   um unico lugar de verdade para labels e valores.
// =============================================================================

// Status possiveis de uma execucao (TestRun)
export type RunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

// Status possiveis de um resultado (TestResult)
export type ResultStatus = "PASSED" | "FAILED" | "SKIPPED" | "FLAKY";

// Union type — aceita qualquer dos dois grupos
export type AnyStatus = RunStatus | ResultStatus;

interface StatusStyle {
  color: string;  // cor do texto
  bg: string;     // cor de fundo do badge
  label: string;  // texto exibido
  icon: string;   // simbolo curto
}

export const statusConfig: Record<AnyStatus, StatusStyle> = {
  // Resultados de testes
  PASSED:    { color: "#16a34a", bg: "#dcfce7", label: "Passou",     icon: "✓" },
  FAILED:    { color: "#dc2626", bg: "#fee2e2", label: "Falhou",     icon: "✕" },
  FLAKY:     { color: "#ca8a04", bg: "#fef9c3", label: "Flaky",      icon: "◐" },
  SKIPPED:   { color: "#64748b", bg: "#f1f5f9", label: "Pulado",     icon: "⊘" },

  // Status de execucao
  COMPLETED: { color: "#16a34a", bg: "#dcfce7", label: "Concluido",  icon: "✓" },
  RUNNING:   { color: "#7c3aed", bg: "#f5f3ff", label: "Executando", icon: "↻" },
  PENDING:   { color: "#2563eb", bg: "#eff6ff", label: "Pendente",   icon: "○" },
  CANCELLED: { color: "#6b7280", bg: "#f3f4f6", label: "Cancelado",  icon: "⊗" },
};

// Retorna o estilo de um status (com fallback seguro para status desconhecidos)
export function getStatusStyle(status: string): StatusStyle {
  return (
    statusConfig[status as AnyStatus] ?? {
      color: "#64748b",
      bg: "#f1f5f9",
      label: status,
      icon: "?",
    }
  );
}
