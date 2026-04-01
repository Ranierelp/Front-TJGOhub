// =============================================================================
// UploadPreview — Step 2: preview dos resultados antes de confirmar
//
// CONCEITO: Processamento client-side antes do envio
//   Antes de enviar ao servidor, calculamos as métricas diretamente no
//   navegador, a partir do JSON parseado no Step 1.
//   Isso é possível porque o arquivo já está em memória (File API).
//
//   Vantagem: o usuário vê um resumo completo ANTES de enviar,
//   podendo detectar erros no arquivo (ex: todos falharam, zero testes).
//
// O envio real acontece só ao clicar "Confirmar e Enviar".
// =============================================================================

"use client";

import { useMemo } from "react";
import { useUploadReport } from "../../hooks/useUploadReport";
import { getStatusStyle } from "@/lib/statusConfig";

// Estrutura mínima do JSON de relatório Playwright
interface ResultItem {
  title:            string;
  status:           "PASSED" | "FAILED" | "SKIPPED" | "FLAKY";
  duration_seconds?: number;
  module?:          string;
  file?:            string;
}

interface ReportJSON {
  run: {
    project_id:      string;
    environment_id:  string;
    branch?:         string;
    commit_sha?:     string;
    commit_message?: string;
    duration_seconds?: number;
    [key: string]:   unknown;
  };
  results: ResultItem[];
}

interface UploadPreviewProps {
  file:          File;
  data:          unknown;
  projectId:     string;
  environmentId: string;
  onBack:        () => void;
  onSuccess:     (runId: string, id: string) => void;
}

// Calcula contagens a partir do array de resultados
function extractSummary(results: ResultItem[]) {
  return {
    total:   results.length,
    passed:  results.filter((r) => r.status === "PASSED").length,
    failed:  results.filter((r) => r.status === "FAILED").length,
    flaky:   results.filter((r) => r.status === "FLAKY").length,
    skipped: results.filter((r) => r.status === "SKIPPED").length,
  };
}

export function UploadPreview({
  file,
  data,
  projectId,
  environmentId,
  onBack,
  onSuccess,
}: UploadPreviewProps) {
  const { submit, loading, error } = useUploadReport();
  const report = data as ReportJSON;

  // useMemo: calcula summary apenas quando `data` muda (não a cada render)
  const summary = useMemo(() => extractSummary(report.results ?? []), [report.results]);
  const previewResults = report.results.slice(0, 20);
  const extraCount     = report.results.length - previewResults.length;

  const handleConfirm = async () => {
    // Monta o payload garantindo que project_id e environment_id corretos
    const payload = {
      ...report,
      run: {
        ...report.run,
        project_id:     projectId,
        environment_id: environmentId,
      },
    };

    const result = await submit(payload);
    if (result) {
      onSuccess(result.id, result.run_id);
    }
  };

  // Métricas: borderTop colorido por status
  const metrics = [
    { label: "Total",   value: summary.total,   color: "#2563eb" },
    { label: "Passou",  value: summary.passed,  color: "#16a34a" },
    { label: "Falhou",  value: summary.failed,  color: "#dc2626" },
    { label: "Flaky",   value: summary.flaky,   color: "#ca8a04" },
    { label: "Pulado",  value: summary.skipped, color: "#64748b" },
  ];

  const cardStyle: React.CSSProperties = {
    background: "var(--glass-card-bg)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: 12,
    border: "1px solid var(--glass-card-border)",
    boxShadow: "var(--glass-shadow)",
  };

  return (
    <div>
      {/* Cards de métricas — grid 5 colunas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{ ...cardStyle, padding: "16px 14px", borderTop: `3px solid ${m.color}` }}
          >
            <div style={{ fontSize: 26, fontWeight: 800, color: m.color, lineHeight: 1 }}>
              {m.value}
            </div>
            <div style={{ fontSize: 11, color: "var(--col-dim)", marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Info do arquivo */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" as const, fontSize: 13, color: "var(--col-muted)" }}>
          <span>📄 <strong style={{ color: "var(--col-heading)" }}>{file.name}</strong></span>
          {report.run.branch && (
            <span>🌿 <strong style={{ color: "var(--col-heading)" }}>{report.run.branch}</strong></span>
          )}
          {report.run.commit_sha && (
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#2563eb" }}>
              {report.run.commit_sha.slice(0, 8)}
            </span>
          )}
          {report.run.duration_seconds && (
            <span>⏱ {report.run.duration_seconds.toFixed(1)}s</span>
          )}
        </div>
      </div>

      {/* Barra de proporção */}
      {summary.total > 0 && (
        <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 20, background: "var(--glass-field-bg)" }}>
          {summary.passed  > 0 && <div style={{ width: `${(summary.passed  / summary.total) * 100}%`, background: "#16a34a", transition: "width 0.4s" }} />}
          {summary.flaky   > 0 && <div style={{ width: `${(summary.flaky   / summary.total) * 100}%`, background: "#ca8a04", transition: "width 0.4s" }} />}
          {summary.failed  > 0 && <div style={{ width: `${(summary.failed  / summary.total) * 100}%`, background: "#dc2626", transition: "width 0.4s" }} />}
          {summary.skipped > 0 && <div style={{ width: `${(summary.skipped / summary.total) * 100}%`, background: "#64748b", transition: "width 0.4s" }} />}
        </div>
      )}

      {/* Lista compacta de resultados */}
      <div style={{ ...cardStyle, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--glass-card-border)", fontSize: 12, fontWeight: 700, color: "var(--col-label)", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
          Prévia dos resultados ({Math.min(previewResults.length, 20)} de {summary.total})
        </div>
        {previewResults.map((r, i) => {
          const s = getStatusStyle(r.status);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                borderBottom: i < previewResults.length - 1 ? "1px solid var(--glass-inner-border)" : "none",
                borderLeft: `3px solid ${s.color}`,
              }}
            >
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 22, height: 22, borderRadius: 5, flexShrink: 0,
                background: s.bg, color: s.color, fontSize: 10, fontWeight: 700,
              }}>
                {s.icon}
              </span>
              <span style={{ flex: 1, fontSize: 13, color: "var(--col-heading)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                {r.title}
              </span>
              {r.module && (
                <span style={{ fontSize: 11, color: "var(--col-dim)", fontFamily: "monospace", flexShrink: 0 }}>
                  {r.module}
                </span>
              )}
              {r.duration_seconds !== undefined && (
                <span style={{ fontSize: 11, color: "var(--col-muted)", fontFamily: "monospace", flexShrink: 0 }}>
                  {r.duration_seconds.toFixed(1)}s
                </span>
              )}
            </div>
          );
        })}
        {extraCount > 0 && (
          <div style={{ padding: "10px 16px", fontSize: 12, color: "var(--col-dim)", textAlign: "center" as const }}>
            e mais {extraCount} resultado{extraCount !== 1 ? "s" : ""}...
          </div>
        )}
      </div>

      {/* Erro de envio */}
      {error && (
        <div style={{
          background: "#fee2e2", border: "1px solid #fca5a5",
          borderRadius: 8, padding: "10px 16px", marginBottom: 16,
          fontSize: 13, color: "#dc2626",
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Ações */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <button
          onClick={onBack}
          disabled={loading}
          style={{
            padding: "10px 20px", borderRadius: 8,
            border: "1.5px solid var(--glass-card-border)",
            background: "var(--glass-field-bg)",
            color: "var(--col-muted)", fontSize: 14, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
            opacity: loading ? 0.6 : 1,
          }}
        >
          ← Voltar
        </button>

        <button
          onClick={handleConfirm}
          disabled={loading}
          style={{
            padding: "12px 28px", borderRadius: 8, border: "none",
            fontSize: 14, fontWeight: 700, fontFamily: "inherit",
            cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "#94a3b8" : "#2563eb",
            color: "white",
            boxShadow: loading ? "none" : "0 4px 14px rgba(37,99,235,0.3)",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          {loading ? (
            <>
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>↻</span>
              Enviando...
            </>
          ) : (
            "✓ Confirmar e Enviar"
          )}
        </button>
      </div>
    </div>
  );
}
