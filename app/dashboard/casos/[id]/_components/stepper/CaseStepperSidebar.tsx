"use client";

// =============================================================================
// CaseStepperSidebar — coluna esquerda do CaseViewMode
//
// Lista vertical dos passos com 3 estados visuais:
//   • ATIVO     → círculo brand-solid preenchido + halo brand-glow
//   • CONCLUÍDO → círculo success com check
//   • FUTURO    → círculo branco com borda neutra
//
// Linha vertical contínua atrás dos círculos liga visualmente os passos.
// =============================================================================

import type { Attachment } from "../CaseViewMode";

interface Props {
  steps:      Attachment[];
  activeStep: number;
  onSelect:   (index: number) => void;
}

export function CaseStepperSidebar({ steps, activeStep, onSelect }: Props) {
  return (
    <aside
      className="overflow-auto py-[18px] pl-[18px] pr-3.5"
      style={{
        background:  "var(--glass-card-bg)",
        borderRight: "1px solid var(--glass-card-border)",
      }}
    >
      {/* Header da sidebar — label + contagem */}
      <div className="mb-3 flex items-center justify-between">
        <span
          className="text-[11px] font-extrabold uppercase tracking-wider"
          style={{ color: "var(--col-heading)" }}
        >
          Passos
        </span>
        <span
          className="rounded px-1.5 py-[1px] font-mono text-[10px] font-bold"
          style={{ background: "var(--brand-bg)", color: "var(--brand-fg)" }}
        >
          {steps.length}
        </span>
      </div>

      {steps.length === 0 ? (
        <p className="text-xs px-2 py-3" style={{ color: "var(--col-dim)" }}>
          Nenhum passo cadastrado.
        </p>
      ) : (
        <div className="relative">
          {/* Linha vertical contínua — alinhada ao centro dos círculos.
              Cálculo: button.p-2 (8px) + half-circle (14px) - half-line (1px) = 21px da esquerda.
              Vertical: começa no centro do 1º círculo (top 22px) e termina no centro do último (bottom 26px). */}
          <div
            className="absolute left-[21px] top-[22px] bottom-[26px] w-[2px]"
            style={{ background: "var(--col-divider)" }}
            aria-hidden
          />

          {steps.map((step, i) => {
            const active = i === activeStep;
            const done   = i <  activeStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelect(i)}
                className={`relative flex w-full items-start gap-2.5 rounded-md p-2 pb-3 text-left transition-colors ${
                  active ? "" : "hover:bg-slate-50"
                }`}
              >
                {/* Círculo do número — z-1 fica sobre a linha */}
                <span
                  className="relative z-[1] inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 font-mono text-[11px] font-extrabold transition-all"
                  style={{
                    background: active
                      ? "var(--brand-solid)"
                      : done
                        ? "var(--success-bg)"
                        : "var(--glass-card-bg)",
                    color: active
                      ? "#fff"
                      : done
                        ? "var(--success-fg)"
                        : "var(--col-dim)",
                    borderColor: active
                      ? "var(--brand-solid)"
                      : done
                        ? "var(--success-border)"
                        : "var(--col-divider)",
                    boxShadow: active ? "0 0 0 4px var(--brand-glow)" : "none",
                  }}
                >
                  {done ? "✓" : i + 1}
                </span>

                {/* Título do passo */}
                <div className="min-w-0 flex-1 pt-1">
                  <div
                    className={`text-[12px] leading-snug [text-wrap:pretty] ${
                      active ? "font-bold" : "font-semibold"
                    }`}
                    style={{
                      color: active ? "var(--col-heading)" : "var(--col-muted)",
                    }}
                  >
                    {step.title || `Passo ${i + 1}`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
