// =============================================================================
// UploadForm — Step 1: selects de projeto/ambiente + dropzone
//
// Lógica de habilitação:
//   - Select de Ambiente: disabled até projeto ser selecionado
//   - Ao trocar projeto: limpa ambiente E arquivo (evita inconsistência)
//   - Botão "Prosseguir": disabled até ter projeto + ambiente + arquivo válido
//
// Props:
//   onNext(file, data, projectId, environmentId) — chamado ao prosseguir
//   O pai (NovoRunClient) recebe esses dados e avança para o Step 2
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useEnvironments } from "../../hooks/useEnvironments";
import { UploadDropzone } from "./UploadDropzone";

interface UploadFormProps {
  onNext: (
    file: File,
    data: unknown,
    projectId: string,
    environmentId: string,
  ) => void;
}

export function UploadForm({ onNext }: UploadFormProps) {
  const [projectId, setProjectId]       = useState<string>("");
  const [environmentId, setEnvironmentId] = useState<string>("");
  const [file, setFile]                 = useState<File | null>(null);
  const [fileData, setFileData]         = useState<unknown>(null);

  const { projects, loading: loadingProjects }       = useProjects();
  const { environments, loading: loadingEnvironments } = useEnvironments(projectId || null);

  const handleProjectChange = useCallback((id: string) => {
    setProjectId(id);
    setEnvironmentId(""); // limpa ambiente ao trocar projeto
    setFile(null);        // limpa arquivo também (project_id no JSON pode não bater)
    setFileData(null);
  }, []);

  const handleFileLoaded = useCallback((f: File, data: unknown) => {
    setFile(f);
    setFileData(data);
  }, []);

  const handleClear = useCallback(() => {
    setFile(null);
    setFileData(null);
  }, []);

  const canProceed = Boolean(projectId && environmentId && file && fileData);

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

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--col-label)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    display: "block",
    marginBottom: 8,
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

  return (
    <div>
      {/* Selects: Projeto e Ambiente em grid 2 colunas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Select de Projeto */}
        <div style={cardStyle}>
          <label style={labelStyle}>
            Projeto <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <select
            value={projectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            disabled={loadingProjects}
            style={selectStyle}
          >
            <option value="">
              {loadingProjects ? "Carregando..." : "Selecione um projeto..."}
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Select de Ambiente — desabilitado até projeto ser escolhido */}
        <div style={{ ...cardStyle, opacity: projectId ? 1 : 0.45, transition: "opacity 0.2s" }}>
          <label style={labelStyle}>
            Ambiente <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <select
            value={environmentId}
            onChange={(e) => setEnvironmentId(e.target.value)}
            disabled={!projectId || loadingEnvironments}
            style={selectStyle}
          >
            <option value="">
              {!projectId
                ? "Selecione um projeto primeiro"
                : loadingEnvironments
                ? "Carregando..."
                : "Selecione um ambiente..."}
            </option>
            {environments.map((env) => (
              <option key={env.id} value={env.id}>{env.env_type_display}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dropzone de arquivo */}
      <div style={{ marginBottom: 24 }}>
        <UploadDropzone
          selectedFile={file}
          onFileLoaded={handleFileLoaded}
          onClear={handleClear}
        />
      </div>

      {/* Ações */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button
          disabled={!canProceed}
          onClick={() => {
            if (canProceed && file && fileData) {
              onNext(file, fileData, projectId, environmentId);
            }
          }}
          style={{
            padding: "12px 28px",
            borderRadius: 8,
            border: "none",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: canProceed ? "pointer" : "not-allowed",
            background: canProceed ? "#2563eb" : "#94a3b8",
            color: "white",
            opacity: canProceed ? 1 : 0.6,
            boxShadow: canProceed ? "0 4px 14px rgba(37,99,235,0.3)" : "none",
            transition: "all 0.2s",
          }}
        >
          Validar e Prosseguir →
        </button>
      </div>
    </div>
  );
}
