"use client";

// =============================================================================
// CaseMetaSidebar — coluna direita do CaseViewMode
//
// Estrutura:
//   • Header com 2 tabs: "Detalhes" e "Histórico" (badge com contagem)
//   • Tab "Detalhes" → Objetivo / Pré-condições / Pós-condições / Observações
//   • Tab "Histórico" → CaseHistoryTimeline (timeline de edições)
//
// O estado da tab vive aqui mesmo — não precisa subir pro pai.
// =============================================================================

import { useEffect, useState } from "react";

import type { TestCase } from "../CaseViewMode";
import { CaseHistoryTimeline } from "../CaseHistoryTimeline";
import { fetchCaseHistory } from "@/lib/api/caseHistory";

type Tab = "details" | "history";

interface Props {
  caso: TestCase;
}

export function CaseMetaSidebar({ caso }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("details");

  // Contagem de entradas pra mostrar como badge na aba "Histórico".
  // Fetch leve, sem bloquear renderização das outras informações.
  const [historyCount, setHistoryCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchCaseHistory(caso.id)
      .then(entries => {
        if (mounted) setHistoryCount(entries.length);
      })
      .catch(() => {
        // Silencioso — se falhar, só não mostra o badge. O erro real (e o toast)
        // é responsabilidade do CaseHistoryTimeline quando o usuário abrir a aba.
        if (mounted) setHistoryCount(null);
      });
    return () => { mounted = false; };
  }, [caso.id]);

  return (
    <aside
      className="flex flex-col overflow-hidden"
      style={{
        background: "var(--glass-card-bg)",
        borderLeft: "1px solid var(--glass-card-border)",
      }}
    >
      {/* ── Tabs header ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-1 px-[18px]"
        role="tablist"
        aria-label="Detalhes do caso de teste"
        style={{ borderBottom: "1px solid var(--glass-card-border)" }}
      >
        <TabButton
          label="Detalhes"
          isActive={activeTab === "details"}
          onClick={() => setActiveTab("details")}
        />
        <TabButton
          label="Histórico"
          badge={historyCount ?? undefined}
          isActive={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        />
      </div>

      {/* ── Conteúdo da aba ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto px-[18px] py-[18px]">
        {activeTab === "details" && (
          <>
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
          </>
        )}

        {activeTab === "history" && (
          <CaseHistoryTimeline caseId={caso.id} />
        )}
      </div>
    </aside>
  );
}

// ── Subcomponente: TabButton ─────────────────────────────────────────────────

function TabButton({
  label, isActive, onClick, badge,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className="relative inline-flex items-center gap-1.5 px-2 py-2.5 text-[12px] font-semibold transition-colors"
      style={{
        color: isActive ? "var(--brand-fg)" : "var(--col-muted)",
      }}
    >
      {label}
      {typeof badge === "number" && badge > 0 && (
        <span
          className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
          style={{
            background: isActive ? "var(--brand-bg)" : "var(--col-surface)",
            color:      isActive ? "var(--brand-fg)" : "var(--col-dim)",
          }}
        >
          {badge}
        </span>
      )}
      {/* Underline da aba ativa */}
      {isActive && (
        <span
          className="absolute bottom-[-1px] left-1 right-1 h-[2px] rounded-t"
          style={{ background: "var(--brand-solid)" }}
          aria-hidden
        />
      )}
    </button>
  );
}

// ── Subcomponentes auxiliares (mantidos do arquivo original) ────────────────

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
