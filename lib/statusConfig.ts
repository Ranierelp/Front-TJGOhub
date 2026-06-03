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
  PASSED:    { color: "var(--success-fg)", bg: "var(--success-bg)", label: "Passou",     icon: "✓" },
  FAILED:    { color: "var(--danger-fg)",  bg: "var(--danger-bg)",  label: "Falhou",     icon: "✕" },
  FLAKY:     { color: "var(--flaky-fg)",   bg: "var(--flaky-bg)",   label: "Flaky",      icon: "◐" },
  SKIPPED:   { color: "var(--skipped-fg)", bg: "var(--skipped-bg)", label: "Pulado",     icon: "⊘" },

  // Status de execucao
  COMPLETED: { color: "var(--success-fg)", bg: "var(--success-bg)", label: "Concluído",  icon: "✓" },
  RUNNING:   { color: "var(--running-fg)", bg: "var(--running-bg)", label: "Executando", icon: "↻" },
  PENDING:   { color: "var(--pending-fg)", bg: "var(--pending-bg)", label: "Pendente",   icon: "○" },
  CANCELLED: { color: "var(--skipped-fg)", bg: "var(--skipped-bg)", label: "Cancelado",  icon: "⊗" },
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
