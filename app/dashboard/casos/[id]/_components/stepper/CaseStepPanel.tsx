"use client";

// =============================================================================
// CaseStepPanel — coluna central do CaseViewMode (layout stepper)
//
// Mostra o passo ATIVO:
//   • Barra de progresso (passo X de N)
//   • Imagem (se attachment for IMAGE; senão placeholder)
//   • Card "Ação" (description do attachment)
//   • Card "Resultado Esperado" (expected_result do caso — global)
//   • Navegação ‹ ›
//
// O proxy /media do Next remove a origem da URL via .replace(/^https?:\/\/[^/]+/, "").
// =============================================================================

import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import Zoom from "react-medium-image-zoom";
import type { Attachment } from "../CaseViewMode";

interface Props {
  step:            Attachment | null;
  index:           number;     // 0-based, para "Passo X de N"
  total:           number;
  expectedResult:  string;     // campo do TestCase, não do Attachment
  onPrev:          () => void;
  onNext:          () => void;
  canPrev:         boolean;
  canNext:         boolean;
}

export function CaseStepPanel({ step, index, total, expectedResult, onPrev, onNext, canPrev, canNext }: Props) {
  // Caso sem passos cadastrados — estado vazio
  if (!step) {
    return (
      <div className="rounded-2xl p-10 flex items-center justify-center min-h-[400px]"
        style={{
          background:           "var(--glass-card-bg)",
          backdropFilter:       "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border:               "1px solid var(--glass-card-border)",
          boxShadow:            "var(--glass-shadow)",
        }}>
        <p className="text-sm" style={{ color: "var(--col-dim)" }}>Nenhum passo cadastrado para este caso.</p>
      </div>
    );
  }

  const imgSrc       = step.file?.replace(/^https?:\/\/[^/]+/, "") || "";
  const progressPct  = total > 0 ? ((index + 1) / total) * 100 : 0;

  return (
    <section className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background:           "var(--glass-card-bg)",
        backdropFilter:       "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border:               "1px solid var(--glass-card-border)",
        boxShadow:            "var(--glass-shadow)",
      }}>

      {/* Cabeçalho com barra de progresso */}
      <header className="px-6 pt-5 pb-4" style={{ borderBottom: "1px solid var(--glass-inner-border)" }}>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-base font-extrabold tracking-tight" style={{ color: "var(--col-heading)" }}>
            {step.title || `Passo ${index + 1}`}
          </h2>
          <span className="text-xs font-semibold font-mono" style={{ color: "var(--col-dim)" }}>
            Passo {index + 1} de {total}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--glass-field-bg)" }}>
          <div className="h-full transition-all duration-300"
            style={{ width: `${progressPct}%`, background: "#2563EB" }} />
        </div>
      </header>

      {/* Conteúdo do passo */}
      <div className="p-6 space-y-5 flex-1">

        {/* Imagem ou placeholder */}
        <div className="rounded-xl overflow-hidden flex items-center justify-center"
          style={{ background: "var(--glass-field-bg)", border: "1px solid var(--glass-inner-border)", minHeight: 240 }}>
          {step.attachment_type === "IMAGE" && step.file ? (
            <Zoom>
              <img src={imgSrc} alt={step.title}
                className="w-full max-h-[420px] object-contain cursor-zoom-in" />
            </Zoom>
          ) : (
            <div className="flex flex-col items-center gap-2 py-12" style={{ color: "var(--col-dim)" }}>
              <ImageOff className="h-8 w-8" />
              <p className="text-xs">Sem imagem para este passo</p>
            </div>
          )}
        </div>

        {/* Card Descrição do Passo (description do attachment) */}
        <div className="rounded-xl p-4"
          style={{
            background: "rgba(239,246,255,0.4)",
            border:     "1px solid var(--glass-inner-border)",
            borderLeft: "3px solid #2563EB",
          }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#2563EB" }}>
            Descrição do Passo
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--col-body)" }}>
            {step.description || <span style={{ color: "var(--col-dim)" }}>Sem descrição.</span>}
          </p>
        </div>

        {/* Card Resultado Esperado (campo global do caso, exibido em todos os passos) */}
        {expectedResult && (
          <div className="rounded-xl p-4"
            style={{
              background: "rgba(16,185,129,0.05)",
              border:     "1px solid rgba(16,185,129,0.3)",
              borderLeft: "3px solid #10B981",
            }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#059669" }}>
              Resultado Esperado
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--col-body)" }}>{expectedResult}</p>
          </div>
        )}
      </div>

      {/* Navegação */}
      <footer className="flex items-center justify-between px-6 py-4"
        style={{ borderTop: "1px solid var(--glass-inner-border)", background: "var(--glass-card-header)" }}>
        <button type="button" onClick={onPrev} disabled={!canPrev}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: "var(--col-muted)", background: "var(--glass-field-bg)", border: "1px solid var(--glass-inner-border)" }}>
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>
        <button type="button" onClick={onNext} disabled={!canNext}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg,#2563EB,#3B82F6)", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}>
          Próximo <ChevronRight className="h-4 w-4" />
        </button>
      </footer>
    </section>
  );
}
