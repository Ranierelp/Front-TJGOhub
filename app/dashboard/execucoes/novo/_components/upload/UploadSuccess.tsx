// =============================================================================
// UploadSuccess — Step 3: tela de confirmação
//
// Nota importante: o backend retorna 202 PENDING (não 201 COMPLETED).
// O parse do relatório roda em background via Celery — as métricas finais
// (total passed, failed, etc.) ainda não estão disponíveis neste momento.
//
// Por isso mostramos apenas o run_id e dois links:
//   - Voltar à listagem de execuções
//   - Ver a execução específica (onde o status vai de PENDING → COMPLETED)
// =============================================================================

"use client";

import { useRouter } from "next/navigation";

interface UploadSuccessProps {
  runId: string;      // ID UUID do TestRun (para o link de detalhe)
  runHumanId: string; // ex: "run-20260313-001" (para exibir ao usuário)
}

export function UploadSuccess({ runId, runHumanId }: UploadSuccessProps) {
  const router = useRouter();

  return (
    <div
      style={{
        background: "var(--glass-card-bg)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: 16,
        border: "1px solid var(--glass-card-border)",
        padding: "52px 40px",
        textAlign: "center",
        boxShadow: "var(--glass-shadow)",
        animation: "fadeUp 0.3s ease",
      }}
    >
      {/* Ícone animado */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "rgba(22,163,74,0.15)",
          border: "2px solid rgba(22,163,74,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          fontSize: 30,
          color: "#16a34a",
          animation: "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        ✓
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--col-heading)", marginBottom: 8 }}>
        Relatório recebido!
      </h2>
      <p style={{ fontSize: 14, color: "var(--col-muted)", marginBottom: 24 }}>
        Os resultados estão sendo processados em background.
        Em alguns segundos a execução estará concluída.
      </p>

      {/* Run ID em destaque */}
      <div style={{
        display: "inline-block",
        background: "rgba(37,99,235,0.08)",
        border: "1px solid rgba(37,99,235,0.2)",
        borderRadius: 8,
        padding: "8px 18px",
        marginBottom: 32,
      }}>
        <span style={{ fontSize: 11, color: "var(--col-muted)", display: "block", marginBottom: 2 }}>
          ID da execução
        </span>
        <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#2563eb" }}>
          {runHumanId}
        </span>
      </div>

      {/* Botões de ação */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <button
          onClick={() => router.push("/dashboard/execucoes")}
          style={{
            padding: "10px 20px", borderRadius: 8,
            border: "1.5px solid var(--glass-card-border)",
            background: "var(--glass-field-bg)",
            color: "var(--col-muted)", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          ← Voltar às Execuções
        </button>

        <button
          onClick={() => router.push(`/dashboard/execucoes/${runId}`)}
          style={{
            padding: "10px 24px", borderRadius: 8, border: "none",
            background: "#2563eb", color: "white",
            fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
          }}
        >
          Ver Execução →
        </button>
      </div>
    </div>
  );
}
