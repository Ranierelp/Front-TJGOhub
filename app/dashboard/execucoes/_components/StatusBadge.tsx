// Badge de status reutilizavel — usado na listagem e no detalhe de execucoes
// e resultados. Importa as cores do statusConfig central.

import { getStatusStyle } from "@/lib/statusConfig";

interface StatusBadgeProps {
  status: string;
  label?: string;           // sobrescreve o label padrao do statusConfig
  size?: "sm" | "md";
}

export function StatusBadge({ status, label, size = "md" }: StatusBadgeProps) {
  const { color, bg, label: defaultLabel, icon } = getStatusStyle(status);
  const text = label ?? defaultLabel;
  const padding = size === "sm"
    ? "px-1.5 py-0.5 text-[10px]"
    : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-md ${padding}`}
      style={{ color, background: bg }}
      aria-label={`Status: ${text}`}
    >
      <span aria-hidden="true">{icon}</span>
      {text}
    </span>
  );
}
