// =============================================================================
// NovoRunClient — orquestrador da página "Nova Execução"
//
// CONCEITO: Estado elevado (Lifting State Up)
//   Em React, quando vários componentes precisam compartilhar dados,
//   o estado sobe para o pai mais próximo.
//
//   Aqui, o "step" atual e os dados coletados em cada step ficam AQUI.
//   Os filhos (UploadForm, UploadPreview, etc.) recebem callbacks do tipo
//   "me avise quando avançar" e chamam esses callbacks quando pronto.
//
//   O pai decide o que renderizar. Os filhos só fazem o que fazem.
//
//   Paralelo Django: é como um FormWizard — a view central controla em qual
//   "passo" do formulário o usuário está; cada step é um template separado.
// =============================================================================

"use client";

import { useState } from "react";
import { ModeSelector } from "./ModeSelector";
import { StepIndicator } from "./StepIndicator";
import { UploadForm } from "./upload/UploadForm";
import { UploadPreview } from "./upload/UploadPreview";
import { UploadSuccess } from "./upload/UploadSuccess";
import { PipelineConfig } from "./pipeline/PipelineConfig";
import { PipelineRunning } from "./pipeline/PipelineRunning";

type Mode      = "upload" | "pipeline";
type UploadStep = 1 | 2 | 3;
type PipeStep   = "config" | "running";

// Dados coletados no Step 1 para usar no Step 2
interface UploadFormData {
  file:          File;
  data:          unknown;
  projectId:     string;
  environmentId: string;
}

export function NovoRunClient() {
  const [mode, setMode]           = useState<Mode>("upload");
  const [uploadStep, setUploadStep] = useState<UploadStep>(1);
  const [pipeStep, setPipeStep]   = useState<PipeStep>("config");

  // Dados coletados entre steps de upload
  const [formData, setFormData]   = useState<UploadFormData | null>(null);
  const [successData, setSuccessData] = useState<{ runId: string; runHumanId: string } | null>(null);

  // Pipeline mock — projeto/ambiente/branch escolhidos
  const [pipeConfig, setPipeConfig] = useState<{ projectId: string; environmentId: string; branch: string } | null>(null);

  // Ao mudar de modo, reseta os steps para o início
  const handleModeChange = (m: Mode) => {
    setMode(m);
    setUploadStep(1);
    setPipeStep("config");
    setFormData(null);
    setSuccessData(null);
  };

  return (
    <div>
      {/* Seletor de modo — só aparece quando não estamos no step final */}
      {uploadStep !== 3 && pipeStep !== "running" && (
        <ModeSelector mode={mode} onChange={handleModeChange} />
      )}

      {/* ── Modo Upload ──────────────────────────────────────────────── */}
      {mode === "upload" && (
        <>
          {/* Step indicator só para upload (pipeline tem suas próprias etapas) */}
          <StepIndicator currentStep={uploadStep} />

          {uploadStep === 1 && (
            <UploadForm
              onNext={(file, data, projectId, environmentId) => {
                setFormData({ file, data, projectId, environmentId });
                setUploadStep(2);
              }}
            />
          )}

          {uploadStep === 2 && formData && (
            <UploadPreview
              file={formData.file}
              data={formData.data}
              projectId={formData.projectId}
              environmentId={formData.environmentId}
              onBack={() => setUploadStep(1)}
              onSuccess={(runId, runHumanId) => {
                setSuccessData({ runId, runHumanId });
                setUploadStep(3);
              }}
            />
          )}

          {uploadStep === 3 && successData && (
            <UploadSuccess
              runId={successData.runId}
              runHumanId={successData.runHumanId}
            />
          )}
        </>
      )}

      {/* ── Modo Pipeline ────────────────────────────────────────────── */}
      {mode === "pipeline" && (
        <>
          {pipeStep === "config" && (
            <PipelineConfig
              onStart={(projectId, environmentId, branch) => {
                setPipeConfig({ projectId, environmentId, branch });
                setPipeStep("running");
              }}
            />
          )}

          {pipeStep === "running" && pipeConfig && (
            <PipelineRunning
              projectId={pipeConfig.projectId}
              environmentId={pipeConfig.environmentId}
              branch={pipeConfig.branch}
              onBack={() => {
                setPipeStep("config");
                setPipeConfig(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
