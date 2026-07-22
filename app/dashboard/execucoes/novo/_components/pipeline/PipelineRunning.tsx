// =============================================================================
// PipelineRunning — dispara pipeline GitLab CI e aguarda o resultado no Hub
//
// Fluxo real (toda a lógica de dados vive no hook usePipelinePolling):
//   1. Na montagem: POST /api/v1/runs/trigger-pipeline/ → recebe o UUID do
//      TestRun criado no backend (PENDING) + web_url do GitLab
//   2. Polling: GET /api/v1/runs/{id}/ a cada 5s — o run EXATO, por id
//   3. status COMPLETED → métricas | FAILED → tela de falha | 10min → timeout
//   4. Botão navega para /dashboard/execucoes/{run.id}
//
// A animação das etapas é cosmética (timer-based) — reflete as etapas reais
// do .gitlab-ci.yml mas sem sincronização com o GitLab API. Só o DESFECHO
// (sucesso/falha/timeout) é real.
// =============================================================================

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelRun } from "@/lib/api/runs";
import { usePipelinePolling } from "./usePipelinePolling";

const PIPELINE_STAGES = [
  { id: "setup",   name: "Setup ambiente",             icon: "⚙",  duration: "~5s",   delay: 0     },
  { id: "install", name: "Instalar dependências",      icon: "📦", duration: "~15s",  delay: 3000  },
  { id: "tests",   name: "Executar testes Playwright", icon: "🧪", duration: "~2min", delay: 8000  },
  { id: "report",  name: "Gerar relatório",            icon: "📊", duration: "~3s",   delay: 130000 },
  { id: "upload",  name: "Enviar resultados ao Hub",   icon: "☁",  duration: "~2s",   delay: 133000 },
];

type StageStatus = "pending" | "running" | "done";

interface PipelineRunningProps {
  projectId:      string;
  environmentId:  string;
  branch:         string;
  // Presentes só quando a tela foi RESTAURADA (usuário saiu e voltou):
  // reanexam o polling ao run existente, sem re-disparar.
  restoredRunId?:  string;
  restoredWebUrl?: string | null;
  startedAt?:      number;
  onBack:          () => void;
}

export function PipelineRunning({
  projectId,
  environmentId,
  branch,
  restoredRunId,
  restoredWebUrl,
  startedAt,
  onBack,
}: PipelineRunningProps) {
  const router = useRouter();

  const [stageStatuses, setStageStatuses] = useState<StageStatus[]>(
    Array(PIPELINE_STAGES.length).fill("pending"),
  );
  // Ao restaurar, retoma o cronômetro do tempo real decorrido desde o disparo.
  const [elapsed, setElapsed] = useState(
    startedAt ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) : 0,
  );

  // Disparo + polling determinístico por run_id vivem no hook (dados);
  // este componente cuida só da apresentação (animação, cronômetro, telas).
  // Se veio restaurado, passamos o run existente → o hook reanexa sem disparar.
  const { runId, webUrl, completedRun, error, failure, timedOut, isSettled } =
    usePipelinePolling(
      projectId,
      environmentId,
      branch,
      restoredRunId ? { runId: restoredRunId, webUrl: restoredWebUrl ?? null } : undefined,
    );

  const [cancelling, setCancelling] = useState(false);

  // Cancela de verdade: chama o backend (que marca CANCELLED e cancela a
  // pipeline no GitLab) e só então sai da tela. Se falhar, mantém o usuário
  // aqui para tentar de novo — não descarta o acompanhamento silenciosamente.
  const handleCancel = async () => {
    if (!runId) return;           // ainda sem run criado — nada a cancelar
    setCancelling(true);
    try {
      await cancelRun(runId);
      toast.success("Execução cancelada.");
      onBack();
    } catch {
      toast.error("Não foi possível cancelar a execução. Tente novamente.");
      setCancelling(false);
    }
  };

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Ref do relógio — permite pará-lo de fora do closure do efeito principal
  const clockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Em QUALQUER desfecho (sucesso/falha/erro/timeout): para o cronômetro ────
  // e os timers da animação. No sucesso, força todas as etapas para "done"
  // (a animação é baseada em timers fixos; se a pipeline terminar antes dos
  // 130s da etapa "tests", as etapas ficariam presas no meio).
  useEffect(() => {
    if (!isSettled) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (completedRun) {
      setStageStatuses(Array(PIPELINE_STAGES.length).fill("done"));
    }
    if (clockTimerRef.current) {
      clearInterval(clockTimerRef.current);
      clockTimerRef.current = null;
    }
  }, [isSettled, completedRun]);

  // ── Efeito principal: animação cosmética das etapas + cronômetro ────────────
  useEffect(() => {
    // Limpa timers residuais antes de (re)iniciar — seguro para o double-mount do StrictMode
    timers.current.forEach(clearTimeout);
    timers.current = [];

    // Relógio armazenado em ref para poder ser parado de qualquer lugar
    if (clockTimerRef.current) clearInterval(clockTimerRef.current);
    clockTimerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);

    // Animação cosmética das etapas
    PIPELINE_STAGES.forEach((stage, i) => {
      const startT = setTimeout(() => {
        setStageStatuses((prev) => {
          const next = [...prev]; next[i] = "running"; return next;
        });
      }, stage.delay);

      const doneDelay = i < PIPELINE_STAGES.length - 1
        ? PIPELINE_STAGES[i + 1].delay
        : stage.delay + 4000;

      const doneT = setTimeout(() => {
        setStageStatuses((prev) => {
          const next = [...prev]; next[i] = "done"; return next;
        });
      }, doneDelay);

      timers.current.push(startT, doneT);
    });

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      if (clockTimerRef.current) {
        clearInterval(clockTimerRef.current);
        clockTimerRef.current = null;
      }
    };
  }, []);

  const isDone = completedRun !== null;

  const cardStyle: React.CSSProperties = {
    background: "var(--glass-card-bg)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: 12,
    border: "1px solid var(--glass-card-border)",
    boxShadow: "var(--glass-shadow)",
  };

  // ── Tela de desfecho sem sucesso ─────────────────────────────────────────
  // Três casos distintos: o DISPARO falhou (error), a PIPELINE falhou depois
  // de disparada (failure), ou 10 min se passaram sem desfecho (timedOut).
  // Nos dois últimos o link do GitLab existe e é a melhor pista para o usuário.
  const problem = error
    ? { icon: "⚠", color: "#dc2626", title: "Erro ao disparar a pipeline", message: error }
    : failure
    ? { icon: "✕", color: "#dc2626", title: "A pipeline falhou", message: failure }
    : timedOut
    ? {
        icon: "⏱", color: "#ca8a04",
        title: "A pipeline demorou mais que o esperado",
        message: "Paramos de acompanhar por aqui — veja o andamento diretamente no GitLab.",
      }
    : null;

  if (problem) {
    return (
      <div style={{ ...cardStyle, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>{problem.icon}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: problem.color, marginBottom: 8 }}>
          {problem.title}
        </div>
        <div style={{ fontSize: 13, color: "var(--col-muted)", marginBottom: 24 }}>{problem.message}</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={onBack}
            style={{
              padding: "10px 24px", borderRadius: 8, border: "1.5px solid var(--glass-card-border)",
              background: "var(--glass-field-bg)", color: "var(--col-muted)",
              fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            ← Voltar
          </button>
          {webUrl && (
            <a
              href={webUrl} target="_blank" rel="noreferrer"
              style={{
                padding: "10px 24px", borderRadius: 8, border: "none",
                background: "#2563eb", color: "white", textDecoration: "none",
                fontSize: 14, fontWeight: 700, fontFamily: "inherit",
              }}
            >
              Ver no GitLab ↗
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      {/* Header de status */}
      <div style={{
        background: isDone ? "rgba(22,163,74,0.08)" : "rgba(124,58,237,0.08)",
        border: `1px solid ${isDone ? "rgba(22,163,74,0.25)" : "rgba(124,58,237,0.25)"}`,
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: isDone ? "#16a34a" : "#7c3aed",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 18,
            animation: isDone ? "none" : "spin 2s linear infinite",
          }}>
            {isDone ? "✓" : "↻"}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: isDone ? "#16a34a" : "#7c3aed", fontFamily: "inherit" }}>
              {isDone ? "Pipeline concluída!" : "Pipeline em execução..."}
            </div>
            <div style={{ fontSize: 12, color: "var(--col-muted)", display: "flex", alignItems: "center", gap: 8 }}>
              {branch}
              {webUrl && (
                <a href={webUrl} target="_blank" rel="noreferrer"
                  style={{ color: "#2563eb", fontSize: 11, textDecoration: "none" }}>
                  Ver no GitLab ↗
                </a>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "var(--col-heading)" }}>
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
            </div>
            <div style={{ fontSize: 11, color: "var(--col-dim)" }}>tempo decorrido</div>
          </div>
          {!isDone && (
            <button
              onClick={handleCancel}
              disabled={cancelling || !runId}
              style={{
                padding: "7px 14px", borderRadius: 7,
                border: "1.5px solid #fca5a5", background: "#fee2e2",
                color: "#dc2626", fontSize: 12, fontWeight: 600,
                cursor: cancelling || !runId ? "not-allowed" : "pointer",
                opacity: cancelling || !runId ? 0.6 : 1,
                fontFamily: "inherit",
              }}
            >
              {cancelling ? "Cancelando..." : "✕ Cancelar"}
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo: sidebar de etapas + área principal */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
        {/* Sidebar de etapas */}
        <div style={{ ...cardStyle, padding: 16, height: "fit-content", position: "sticky", top: 80 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--col-label)", textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 12 }}>
            Etapas
          </div>
          {PIPELINE_STAGES.map((stage, i) => {
            const st = stageStatuses[i];
            return (
              <div
                key={stage.id}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 0",
                  borderBottom: i < PIPELINE_STAGES.length - 1 ? "1px solid var(--glass-inner-border)" : "none",
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  background: st === "done" ? "rgba(22,163,74,0.12)" : st === "running" ? "rgba(124,58,237,0.1)" : "var(--glass-field-bg)",
                  color: st === "done" ? "#16a34a" : st === "running" ? "#7c3aed" : "var(--col-dim)",
                  animation: st === "running" ? "pulse 1.2s infinite" : "none",
                }}>
                  {st === "done" ? "✓" : st === "running" ? "↻" : (i + 1)}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: st === "running" ? 600 : 400, color: st === "running" ? "var(--col-heading)" : st === "done" ? "#16a34a" : "var(--col-dim)" }}>
                    {stage.name}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--col-dim)" }}>{stage.duration}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Área principal */}
        <div>
          {/* Métricas do run concluído */}
          {completedRun && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                {[
                  { label: "Total",  value: completedRun.total_tests,   color: "#2563eb" },
                  { label: "Passou", value: completedRun.passed_tests,  color: "#16a34a" },
                  { label: "Falhou", value: completedRun.failed_tests,  color: "#dc2626" },
                  { label: "Flaky",  value: completedRun.flaky_tests,   color: "#ca8a04" },
                ].map((m) => (
                  <div key={m.label} style={{ ...cardStyle, padding: "10px 14px", borderTop: `3px solid ${m.color}` }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{m.value}</span>
                    <span style={{ fontSize: 11, color: "var(--col-dim)", marginLeft: 6 }}>{m.label}</span>
                  </div>
                ))}
              </div>

              {completedRun.total_tests > 0 && (
                <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 16, background: "var(--glass-field-bg)" }}>
                  {completedRun.passed_tests > 0 && <div style={{ width: `${(completedRun.passed_tests / completedRun.total_tests) * 100}%`, background: "#16a34a" }} />}
                  {completedRun.flaky_tests  > 0 && <div style={{ width: `${(completedRun.flaky_tests  / completedRun.total_tests) * 100}%`, background: "#ca8a04" }} />}
                  {completedRun.failed_tests > 0 && <div style={{ width: `${(completedRun.failed_tests / completedRun.total_tests) * 100}%`, background: "#dc2626" }} />}
                </div>
              )}

              <div style={{ ...cardStyle, padding: "16px 20px", marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" as const }}>
                  {[
                    { label: "Run ID",    value: completedRun.run_id },
                    { label: "Branch",    value: completedRun.branch || "—" },
                    { label: "Duração",   value: completedRun.duration_formatted || "—" },
                    { label: "Taxa de êxito", value: `${completedRun.success_rate}%` },
                  ].map((item) => (
                    <div key={item.label}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--col-label)", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--col-heading)", fontFamily: "monospace" }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Placeholder enquanto aguarda */}
          {!completedRun && (
            <div style={{ ...cardStyle, padding: "40px 20px", textAlign: "center", color: "var(--col-dim)", fontSize: 13 }}>
              <div style={{ animation: "pulse 1.5s infinite", fontSize: 26, marginBottom: 10 }}>🧪</div>
              {webUrl
                ? "Aguardando o término da pipeline e o envio do relatório..."
                : "Conectando ao GitLab..."}
            </div>
          )}

          {/* Botões pós-conclusão */}
          {isDone && (
            <div style={{ display: "flex", gap: 12, marginTop: 8, justifyContent: "center" }}>
              <button
                onClick={onBack}
                style={{
                  padding: "10px 20px", borderRadius: 8,
                  border: "1.5px solid var(--glass-card-border)",
                  background: "var(--glass-field-bg)",
                  color: "var(--col-muted)", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                ← Nova Pipeline
              </button>
              <button
                onClick={() => router.push(`/dashboard/execucoes/${completedRun!.id}`)}
                style={{
                  padding: "10px 24px", borderRadius: 8, border: "none",
                  background: "#2563eb", color: "white",
                  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Ver Detalhes da Execução →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
