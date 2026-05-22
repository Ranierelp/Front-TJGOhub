"use client";

// =============================================================================
// CaseMetaSidebar — coluna direita do CaseViewMode
//
// Mostra metadados do caso:
//   • Objetivo / Observações → parágrafos
//   • Pré-condições / Pós-condições → bullets (split por quebra de linha)
//
// Labels uppercase finos no padrão do design.
// =============================================================================

import type { TestCase } from "../CaseViewMode";

interface Props {
  caso: TestCase;
}

export function CaseMetaSidebar({ caso }: Props) {
  return (
    <aside
      className="overflow-auto px-[18px] py-[18px]"
      style={{
        background: "var(--glass-card-bg)",
        borderLeft: "1px solid var(--glass-card-border)",
      }}
    >
      <MetaSection title="Objetivo">
        <Paragraph value={caso.objective} />
      </MetaSection>

      <MetaSection title="Pré-condições">
        <BulletList raw={caso.preconditions} />
      </MetaSection>

      <MetaSection title="Pós-condições">
        <BulletList raw={caso.postconditions} />
      </MetaSection>

      <MetaSection title="Observações">
        <Paragraph value={caso.observations} />
      </MetaSection>
    </aside>
  );
}

// ── Subcomponentes ─────────────────────────────────────────────────────────

function MetaSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-[18px]">
      <div
        className="mb-2 text-[10.5px] font-extrabold uppercase tracking-wider"
        style={{ color: "var(--col-dim)" }}
      >
        {title}
      </div>
      {children}
    </section>
  );
}

function Paragraph({ value }: { value?: string | null }) {
  if (!value) {
    return (
      <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--col-dim)" }}>
        Não informado.
      </p>
    );
  }
  return (
    <p
      className="text-[12.5px] leading-relaxed [text-wrap:pretty] whitespace-pre-wrap"
      style={{ color: "var(--col-body)" }}
    >
      {value}
    </p>
  );
}

/**
 * Aceita string crua (textarea livre) e quebra em bullets por linha não-vazia.
 * Linhas que começam com "- " ou "• " têm o prefixo removido.
 */
function BulletList({ raw }: { raw?: string | null }) {
  const items = (raw ?? "")
    .split(/\r?\n/)
    .map(s => s.trim().replace(/^[-•]\s*/, ""))
    .filter(Boolean);

  if (items.length === 0) {
    return (
      <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--col-dim)" }}>
        Não informado.
      </p>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {items.map((p, i) => (
        <li
          key={i}
          className="flex items-start gap-2 text-[12px] leading-relaxed [text-wrap:pretty]"
          style={{ color: "var(--col-body)" }}
        >
          <span
            className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full"
            style={{ background: "var(--col-faint)" }}
            aria-hidden
          />
          <span>{p}</span>
        </li>
      ))}
    </ul>
  );
}
