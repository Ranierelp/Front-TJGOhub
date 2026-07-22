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
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";

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
        {/* Select de Projeto — padrão do app (Radix, components/ui/select).
            Com value="" o Radix mostra o placeholder do trigger. */}
        <div style={cardStyle}>
          <label style={labelStyle}>
            Projeto <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <Select value={projectId} onValueChange={handleProjectChange} disabled={loadingProjects}>
            <SelectTrigger
              className="w-full"
              placeholder={loadingProjects ? "Carregando..." : "Selecione um projeto..."}
            />
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Select de Ambiente — desabilitado até projeto ser escolhido */}
        <div style={{ ...cardStyle, opacity: projectId ? 1 : 0.45, transition: "opacity 0.2s" }}>
          <label style={labelStyle}>
            Ambiente <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <Select
            value={environmentId}
            onValueChange={setEnvironmentId}
            disabled={!projectId || loadingEnvironments}
          >
            <SelectTrigger
              className="w-full"
              placeholder={
                !projectId
                  ? "Selecione um projeto primeiro"
                  : loadingEnvironments
                  ? "Carregando..."
                  : "Selecione um ambiente..."
              }
            />
            <SelectContent>
              {environments.map((env) => (
                <SelectItem key={env.id} value={env.id}>{env.env_type_display}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
