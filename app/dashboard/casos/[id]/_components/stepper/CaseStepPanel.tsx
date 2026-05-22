"use client";

// =============================================================================
// CaseStepPanel — coluna central do CaseViewMode
//
// Estrutura:
//   • Linha de progresso: pílula "PASSO X DE N" + trilho preenchido + setas ‹ ›
//   • Título do passo
//   • Screenshot (se IMAGE) ou placeholder com chrome fake
//   • Grade 2 col: card Ação (azul/brand) + card Resultado Esperado (verde/success)
// =============================================================================

import { ChevronLeft, ChevronRight } from "lucide-react";
import Zoom from "react-medium-image-zoom";
import type { Attachment } from "../CaseViewMode";

interface Props {
  step:            Attachment | null;
  index:           number;     // 0-based
  total:           number;
  expectedResult:  string;
  onPrev:          () => void;
  onNext:          () => void;
  canPrev:         boolean;
  canNext:         boolean;
}

export function CaseStepPanel({ step, index, total, expectedResult, onPrev, onNext, canPrev, canNext }: Props) {
  // Caso sem passos — estado vazio centralizado
  if (!step) {
    return (
      <main className="overflow-auto px-8 py-6 flex items-center justify-center">
        <p className="text-sm" style={{ color: "var(--col-dim)" }}>
          Nenhum passo cadastrado para este caso.
        </p>
      </main>
    );
  }

  const imgSrc      = step.file?.replace(/^https?:\/\/[^/]+/, "") || "";
  const progressPct = total > 0 ? ((index + 1) / total) * 100 : 0;
  const placeholderTag = step.title?.toLowerCase().replace(/\s+/g, "-").slice(0, 24) || `passo-${index + 1}`;

  return (
    <main className="overflow-auto px-8 py-6">
      {/* Barra de progresso: pílula + trilho + setas */}
      <div className="mb-3.5 flex items-center gap-2">
        <span
          className="rounded px-2 py-[3px] font-mono text-[10px] font-bold uppercase tracking-wider"
          style={{ background: "var(--brand-bg)", color: "var(--brand-fg)" }}
        >
          Passo {index + 1} de {total}
        </span>
        <div className="h-1 flex-1 rounded-full" style={{ background: "var(--col-divider)" }}>
          <div
            className="h-full rounded-full transition-[width] duration-200"
            style={{ width: `${progressPct}%`, background: "var(--brand-solid)" }}
          />
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Passo anterior"
            onClick={onPrev}
            disabled={!canPrev}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderColor: "var(--glass-card-border)",
              background:  "var(--glass-card-bg)",
              color:       "var(--col-muted)",
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Próximo passo"
            onClick={onNext}
            disabled={!canNext}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderColor: "var(--glass-card-border)",
              background:  "var(--glass-card-bg)",
              color:       "var(--col-muted)",
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Título do passo */}
      <h2
        className="mb-3.5 text-lg font-extrabold leading-snug"
        style={{ color: "var(--col-heading)" }}
      >
        {step.title || `Passo ${index + 1}`}
      </h2>

      {/* Imagem real (se IMAGE) ou placeholder estilizado */}
      {step.attachment_type === "IMAGE" && step.file ? (
        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: "var(--glass-card-border)", background: "var(--surface-app)" }}
        >
          <Zoom>
            <img
              src={imgSrc}
              alt={step.title}
              className="w-full max-h-[420px] object-contain cursor-zoom-in"
            />
          </Zoom>
        </div>
      ) : (
        <ScreenshotPlaceholder tag={placeholderTag} />
      )}

      {/* Cards Ação + Resultado Esperado — grid 2 col em md+ */}
      <div className="mt-[18px] grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {/* Card Ação (azul/brand) */}
        <div
          className="rounded-lg border px-3.5 py-3"
          style={{ background: "var(--glass-card-bg)", borderColor: "var(--glass-card-border)" }}
        >
          <div className="mb-1.5 inline-flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full" style={{ background: "var(--brand-solid)" }} />
            <span
              className="text-[10.5px] font-bold uppercase tracking-wider"
              style={{ color: "var(--brand-fg)" }}
            >
              Ação
            </span>
          </div>
          <p
            className="text-[13px] leading-relaxed [text-wrap:pretty] whitespace-pre-wrap"
            style={{ color: "var(--col-body)" }}
          >
            {step.description || <span style={{ color: "var(--col-dim)" }}>Sem descrição.</span>}
          </p>
        </div>

        {/* Card Resultado Esperado (verde/success) — só renderiza se houver valor */}
        {expectedResult && (
          <div
            className="rounded-lg border px-3.5 py-3"
            style={{ background: "var(--success-bg)", borderColor: "var(--success-border)" }}
          >
            <div className="mb-1.5 inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full" style={{ background: "var(--success-fg)" }} />
              <span
                className="text-[10.5px] font-bold uppercase tracking-wider"
                style={{ color: "var(--success-fg)" }}
              >
                Resultado Esperado
              </span>
            </div>
            <p
              className="text-[13px] leading-relaxed [text-wrap:pretty] whitespace-pre-wrap"
              style={{ color: "var(--success-fg)" }}
            >
              {expectedResult}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

/**
 * Placeholder para passos sem screenshot — chrome de navegador fake com
 * conteúdo cinza sugerido. Mantém 260px de altura para o layout não dançar
 * quando alternar entre passos com e sem imagem.
 */
function ScreenshotPlaceholder({ tag }: { tag: string }) {
  return (
    <div
      className="relative h-[260px] w-full overflow-hidden rounded-lg border"
      style={{ background: "var(--surface-app)", borderColor: "var(--glass-card-border)" }}
      aria-label={`Screenshot placeholder: ${tag}`}
    >
      {/* Chrome fake — barra superior estilo mac */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5"
        style={{ background: "var(--col-divider)", borderBottom: "1px solid var(--glass-card-border)" }}
      >
        <span className="h-2 w-2 rounded-full bg-rose-500" />
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span
          className="ml-2 flex-1 rounded border bg-white px-2 py-[2px] font-mono text-[10px]"
          style={{ borderColor: "var(--glass-card-border)", color: "var(--col-dim)" }}
        >
          {tag}
        </span>
      </div>

      {/* Barras cinzas que sugerem conteúdo */}
      <div className="flex flex-col gap-2 p-3.5">
        <div className="h-3 w-2/5 rounded" style={{ background: "var(--col-divider)" }} />
        <div className="h-2 w-3/4 rounded" style={{ background: "var(--glass-inner-border)" }} />
        <div className="h-2 w-3/5 rounded" style={{ background: "var(--glass-inner-border)" }} />
        <div className="mt-1.5 h-8 w-full rounded" style={{ background: "var(--glass-inner-border)" }} />
        <div className="h-8 w-full rounded" style={{ background: "var(--glass-inner-border)" }} />
        <div className="mt-1 h-7 w-24 rounded" style={{ background: "var(--brand-solid)" }} />
      </div>

      {/* Selo "screenshot · tag" no canto inferior direito */}
      <div
        className="absolute bottom-2 right-2.5 font-mono text-[9px]"
        style={{ color: "var(--col-faint)" }}
      >
        screenshot · {tag}
      </div>
    </div>
  );
}
