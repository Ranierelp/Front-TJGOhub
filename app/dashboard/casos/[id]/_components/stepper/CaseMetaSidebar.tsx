"use client";

// =============================================================================
// CaseMetaSidebar — coluna direita do CaseViewMode (layout stepper)
//
// Mostra metadados textuais do caso de teste:
//   Objetivo, Pré-condições, Pós-condições, Observações.
//
// Campos são strings de texto livre (não arrays) — exibidos como parágrafos.
// =============================================================================

import type { TestCase } from "../CaseViewMode";

interface Props {
  caso: TestCase;
}

// Mini-componente local para reduzir repetição de markup
function MetaSection({ label, value }: { label: string; value?: string | null }) {
  return (
    <section>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
        style={{ color: "var(--col-label)" }}>
        {label}
      </p>
      <p className="text-xs leading-relaxed whitespace-pre-wrap"
        style={{ color: value ? "var(--col-body)" : "var(--col-dim)" }}>
        {value || "Não informado."}
      </p>
    </section>
  );
}

export function CaseMetaSidebar({ caso }: Props) {
  return (
    <aside
      className="rounded-2xl p-5 space-y-5 self-start sticky top-4"
      style={{
        background:           "var(--glass-card-bg)",
        backdropFilter:       "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border:               "1px solid var(--glass-card-border)",
        boxShadow:            "var(--glass-shadow)",
      }}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#3B82F6" }}>
          🎯 Contexto
        </p>
      </div>

      <MetaSection label="Objetivo"       value={caso.objective}      />
      <hr style={{ borderColor: "var(--glass-inner-border)" }} />
      <MetaSection label="Pré-condições"  value={caso.preconditions}  />
      <hr style={{ borderColor: "var(--glass-inner-border)" }} />
      <MetaSection label="Pós-condições"  value={caso.postconditions} />
      <hr style={{ borderColor: "var(--glass-inner-border)" }} />
      <MetaSection label="Observações"    value={caso.observations}   />
    </aside>
  );
}