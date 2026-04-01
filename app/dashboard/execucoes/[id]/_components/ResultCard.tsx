// Card expandivel de resultado individual.
//
// Design: borda lateral colorida por status, icone em quadrado arredondado,
// case_id em monospace, expand com animacao suave.
// Botoes "Marcar como Flaky" e "Copiar erro" aparecem no estado expandido.

"use client";

import React, { useState, useCallback } from "react";
import { ChevronRight, AlertTriangle, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "../../_components/StatusBadge";
import { ErrorDetail } from "./ErrorDetail";
import { getResult, markResultAsFlaky } from "@/lib/api/runs";
import type { TestResult, TestResultDetail } from "@/lib/api/runs";

// Estilos visuais de cada status (borda lateral + icone quadrado)
const STATUS_STYLE: Record<string, { border: string; iconBg: string; iconColor: string; icon: string }> = {
  PASSED:  { border: "#16a34a", iconBg: "#dcfce7", iconColor: "#16a34a", icon: "✓" },
  FAILED:  { border: "#dc2626", iconBg: "#fee2e2", iconColor: "#dc2626", icon: "✗" },
  FLAKY:   { border: "#ca8a04", iconBg: "#fef9c3", iconColor: "#ca8a04", icon: "~" },
  SKIPPED: { border: "#64748b", iconBg: "#f1f5f9", iconColor: "#64748b", icon: "—" },
};

function ResultCard({ result, onMarkedFlaky }: { result: TestResult; onMarkedFlaky?: () => void }) {
  const [expanded, setExpanded]           = useState(false);
  const [detail, setDetail]               = useState<TestResultDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [markingFlaky, setMarkingFlaky]   = useState(false);
  const [localStatus, setLocalStatus]     = useState<TestResult["status"]>(result.status);
  const [copied, setCopied]               = useState(false);

  const canExpand = localStatus !== "SKIPPED";
  const style     = STATUS_STYLE[localStatus] ?? STATUS_STYLE.SKIPPED;

  // Expande/colapsa — busca detalhe lazy so se FAILED ou FLAKY
  const handleToggle = useCallback(async () => {
    if (!canExpand) return;
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (willExpand && !detail && (localStatus === "FAILED" || localStatus === "FLAKY")) {
      setLoadingDetail(true);
      try {
        const res = await getResult(result.id);
        setDetail(res.data);
      } catch {
        // silencia — exibe error_summary como fallback
      } finally {
        setLoadingDetail(false);
      }
    }
  }, [expanded, detail, localStatus, result.id, canExpand]);

  // Marca como flaky e atualiza o card sem recarregar a pagina
  const handleMarkFlaky = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMarkingFlaky(true);
    try {
      await markResultAsFlaky(result.id);
      setLocalStatus("FLAKY");
      toast.success("Marcado como Flaky com sucesso");
      onMarkedFlaky?.();
    } catch {
      toast.error("Erro ao marcar como Flaky");
    } finally {
      setMarkingFlaky(false);
    }
  }, [result.id]);

  // Copia o erro para o clipboard
  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = detail?.error_message ?? result.error_summary ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [detail, result.error_summary]);

  const errorText    = detail?.error_message ?? result.error_summary;
  const displayTitle = result.title || result.test_case_title || "Sem titulo";

  return (
    <div
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
      style={{
        borderLeft: `4px solid ${style.border}`,
        borderRadius: "10px",
        boxShadow: "0 1px 3px rgba(26,35,50,0.05), 0 3px 10px rgba(26,35,50,0.03)",
        overflow: "hidden",
      }}
    >
      {/* Cabecalho clicavel */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50"
        onClick={handleToggle}
        disabled={!canExpand}
        style={{ cursor: canExpand ? "pointer" : "default" }}
      >
        {/* Icone de status em quadrado arredondado */}
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: style.iconBg, color: style.iconColor, fontSize: 14, fontWeight: 700,
        }}>
          {style.icon}
        </span>

        {/* Titulo e case_id */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {result.test_case_case_id && (
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#2563eb", fontWeight: 600, flexShrink: 0 }}>
                {result.test_case_case_id}
              </span>
            )}
            <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--col-heading)" }}>
              {displayTitle}
            </p>
          </div>
          {result.retry_number > 0 && (
            <p style={{ fontSize: 11, color: "#ca8a04", marginTop: 2 }}>
              ↻ {result.retry_number} retry
            </p>
          )}
        </div>

        {/* Duracao + Badge + Seta */}
        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#5b6b7f", flexShrink: 0 }}>
          {result.duration_formatted}
        </span>
        <StatusBadge status={localStatus} size="sm" />
        {canExpand && (
          <ChevronRight size={14} style={{
            color: "#8d9bac", flexShrink: 0,
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }} />
        )}
      </button>

      {/* Conteudo expandido */}
      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3 animate-fade-slide-in">
          {localStatus === "PASSED" ? (
            <div style={{ background: "#dcfce7", borderRadius: 8, padding: "10px 14px" }}>
              <p style={{ fontSize: 13, color: "#16a34a", fontWeight: 500 }}>
                ✓ Teste executado com sucesso em {result.duration_formatted}. Nenhum erro detectado.
              </p>
            </div>
          ) : loadingDetail ? (
            <p style={{ fontSize: 12, color: "#8d9bac" }}>Carregando detalhes do erro...</p>
          ) : errorText ? (
            <>
              <ErrorDetail errorMessage={errorText} stackTrace={detail?.stack_trace} />
              <div className="flex gap-2">
                {localStatus === "FAILED" && (
                  <button
                    onClick={handleMarkFlaky}
                    disabled={markingFlaky}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      background: "#fef9c3", color: "#ca8a04", border: "none",
                      borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600,
                      cursor: markingFlaky ? "not-allowed" : "pointer", opacity: markingFlaky ? 0.7 : 1,
                    }}
                  >
                    <AlertTriangle size={12} />
                    {markingFlaky ? "Marcando..." : "Marcar como Flaky"}
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                  style={{
                    color: "var(--col-muted)", borderRadius: 6, padding: "6px 12px",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {copied ? <><Check size={12} />Copiado!</> : <><Copy size={12} />Copiar erro</>}
                </button>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 12, color: "#8d9bac" }}>Sem detalhes de erro disponiveis</p>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(ResultCard);
