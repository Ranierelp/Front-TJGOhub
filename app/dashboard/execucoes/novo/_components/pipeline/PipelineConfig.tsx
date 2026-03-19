// =============================================================================
// PipelineConfig — configuração inicial para disparar pipeline GitLab CI
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useEnvironments } from "../../hooks/useEnvironments";

const PIPELINE_STAGES = [
  { icon: "⚙",  name: "Setup ambiente",              duration: "~5s" },
  { icon: "📦", name: "Instalar dependências",        duration: "~15s" },
  { icon: "🧪", name: "Executar testes Playwright",  duration: "~2min" },
  { icon: "📊", name: "Gerar relatório",              duration: "~3s" },
  { icon: "☁",  name: "Enviar resultados ao Hub",    duration: "~2s" },
];

interface PipelineConfigProps {
  onStart: (projectId: string, environmentId: string, branch: string) => void;
}

export function PipelineConfig({ onStart }: PipelineConfigProps) {
  const [projectId, setProjectId]       = useState("");
  const [environmentId, setEnvironmentId] = useState("");
  const [branch, setBranch]             = useState("");

  const { projects, loading: loadingProjects }       = useProjects();
  const { environments, loading: loadingEnvironments } = useEnvironments(projectId || null);

  const handleProjectChange = useCallback((id: string) => {
    setProjectId(id);
    setEnvironmentId("");
    setBranch("");
  }, []);

  const canStart = Boolean(projectId && environmentId && branch);

  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1.5px solid var(--glass-card-border)",
    background: "var(--glass-field-bg)",
    fontSize: 14,
    color: "var(--col-heading)",
    fontFamily: "inherit",
    appearance: "none" as const,
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235b6b7f' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: 36,
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--glass-card-bg)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: 12,
    border: "1px solid var(--glass-card-border)",
    padding: 20,
    boxShadow: "var(--glass-shadow)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--col-label)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    display: "block",
    marginBottom: 8,
  };

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      {/* Banner informativo */}
      <div style={{
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: 10,
        padding: "12px 18px",
        marginBottom: 24,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        fontSize: 13,
        color: "#2563eb",
      }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>ℹ</span>
        <span>
          Isso vai disparar uma pipeline no <strong>GitLab CI</strong> que executa
          os testes Playwright e envia os resultados automaticamente para o Hub.
        </span>
      </div>

      {/* Grid 3 colunas: Projeto, Ambiente, Branch */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={cardStyle}>
          <label style={labelStyle}>Projeto <span style={{ color: "#dc2626" }}>*</span></label>
          <select value={projectId} onChange={(e) => handleProjectChange(e.target.value)} style={selectStyle}>
            <option value="">{loadingProjects ? "Carregando..." : "Selecione..."}</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div style={{ ...cardStyle, opacity: projectId ? 1 : 0.45, transition: "opacity 0.2s" }}>
          <label style={labelStyle}>Ambiente <span style={{ color: "#dc2626" }}>*</span></label>
          <select value={environmentId} onChange={(e) => setEnvironmentId(e.target.value)} disabled={!projectId || loadingEnvironments} style={selectStyle}>
            <option value="">{!projectId ? "Selecione um projeto primeiro" : loadingEnvironments ? "Carregando..." : "Selecione..."}</option>
            {environments.map((env) => <option key={env.id} value={env.id}>{env.env_type_display}</option>)}
          </select>
        </div>

        <div style={{ ...cardStyle, opacity: projectId ? 1 : 0.45, transition: "opacity 0.2s" }}>
          <label style={labelStyle}>Branch <span style={{ color: "#dc2626" }}>*</span></label>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            disabled={!projectId}
            placeholder="ex: main"
            style={{ ...selectStyle, backgroundImage: "none", paddingRight: 14 }}
          />
        </div>
      </div>

      {/* Preview das etapas da pipeline */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--col-heading)", marginBottom: 16 }}>
          Etapas da Pipeline
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
          {PIPELINE_STAGES.map((stage, i) => (
            <div key={stage.name} style={{ display: "flex", alignItems: "center", flex: i < PIPELINE_STAGES.length - 1 ? "1 1 0" : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "var(--glass-field-bg)", border: "1.5px solid var(--glass-card-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                }}>
                  {stage.icon}
                </div>
                <span style={{ fontSize: 10, color: "var(--col-muted)", textAlign: "center", maxWidth: 76 }}>{stage.name}</span>
                <span style={{ fontSize: 9, color: "var(--col-dim)" }}>{stage.duration}</span>
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <div style={{ flex: 1, height: 2, background: "var(--glass-card-border)", margin: "0 6px", marginBottom: 36 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Botão de ação */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => canStart && onStart(projectId, environmentId, branch)}
          disabled={!canStart}
          style={{
            padding: "12px 28px", borderRadius: 8, border: "none",
            fontSize: 14, fontWeight: 700, fontFamily: "inherit",
            cursor: canStart ? "pointer" : "not-allowed",
            background: canStart ? "#2563eb" : "#94a3b8",
            color: "white",
            opacity: canStart ? 1 : 0.55,
            boxShadow: canStart ? "0 4px 14px rgba(37,99,235,0.3)" : "none",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          🚀 Iniciar Pipeline
        </button>
      </div>
    </div>
  );
}
