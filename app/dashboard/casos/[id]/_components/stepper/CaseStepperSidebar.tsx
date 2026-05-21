"use client";

// =============================================================================
// CaseStepperSidebar — coluna esquerda do CaseViewMode (layout stepper)
//
// Lista os passos (attachments) numerados verticalmente. Marca:
//   • passo ATIVO  → círculo azul gradiente com ring
//   • passos PASSADOS → círculo verde com ✓
//   • passos FUTUROS  → círculo com borda neutra (var(--glass-inner-border))
//
// Visual segue a paleta do projeto (CSS vars / var(--col-*) / var(--glass-*)).
// =============================================================================

import { Check } from "lucide-react";
import type { Attachment } from "../CaseViewMode";

interface Props {
  steps:      Attachment[];
  activeStep: number;
  onSelect:   (index: number) => void;
}

export function CaseStepperSidebar({ steps, activeStep, onSelect }: Props) {
  return (
    <aside
      className="rounded-2xl p-4 self-start sticky top-4"
      style={{
        background:           "var(--glass-card-bg)",
        backdropFilter:       "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border:               "1px solid var(--glass-card-border)",
        boxShadow:            "var(--glass-shadow)",
      }}
    >
      <div className="mb-3 px-2">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#3B82F6" }}>
          Passos do Teste
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--col-dim)" }}>
          {steps.length} {steps.length === 1 ? "passo" : "passos"}
        </p>
      </div>

      {steps.length === 0 ? (
        <p className="text-xs px-2 py-3" style={{ color: "var(--col-dim)" }}>
          Nenhum passo cadastrado.
        </p>
      ) : (
        <ul className="space-y-1">
          {steps.map((step, i) => {
            const isActive = i === activeStep;
            const isDone   = i <  activeStep;

            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => onSelect(i)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left transition-all"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg,rgba(219,234,254,0.5),rgba(239,246,255,0.3))"
                      : "transparent",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(241,245,249,0.5)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Círculo numerado / done / future */}
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={
                      isActive
                        ? {
                            background: "linear-gradient(135deg,#2563EB,#3B82F6)",
                            color:      "#FFFFFF",
                            boxShadow:  "0 0 0 4px rgba(219,234,254,0.8)",
                          }
                        : isDone
                        ? { background: "#10B981", color: "#FFFFFF" }
                        : {
                            background: "var(--glass-field-bg)",
                            color:      "var(--col-dim)",
                            border:     "1px solid var(--glass-inner-border)",
                          }
                    }
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>

                  <span
                    className="text-xs font-semibold flex-1 truncate"
                    style={{ color: isActive ? "var(--col-body)" : "var(--col-muted)" }}
                  >
                    {step.title || `Passo ${i + 1}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}