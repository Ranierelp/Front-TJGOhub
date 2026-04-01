// =============================================================================
// PipelineRunning — dispara pipeline GitLab CI e aguarda o resultado no Hub
//
// Fluxo real:
//   1. Na montagem: POST /api/v1/runs/trigger-pipeline/ → recebe web_url do GitLab
//   2. Polling: GET /api/v1/runs/?project=...&ordering=-started_at a cada 5s
//   3. Quando encontra run com status COMPLETED e started_at > triggeredAt → concluído
//   4. Botão navega para /dashboard/execucoes/{run.id}
//
// A animação das etapas é cosmética (timer-based) — reflete as etapas reais
// do .gitlab-ci.yml mas sem sincronização com o GitLab API.
// =============================================================================

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { triggerPipeline, listRuns, TestRun } from "@/lib/api/runs";

const PIPELINE_STAGES = [
  { id: "setup",   name: "Setup ambiente",             icon: "⚙",  duration: "~5s",   delay: 0     },
  { id: "install", name: "Instalar dependências",      icon: "📦", duration: "~15s",  delay: 3000  },
  { id: "tests",   name: "Executar testes Playwright", icon: "🧪", duration: "~2min", delay: 8000  },
  { id: "report",  name: "Gerar relatório",            icon: "📊", duration: "~3s",   delay: 130000 },
  { id: "upload",  name: "Enviar resultados ao Hub",   icon: "☁",  duration: "~2s",   delay: 133000 },
];

type StageStatus = "pending" | "running" | "done";

interface PipelineRunningProps {
  projectId:     string;
  environmentId: string;
  branch:        string;
  onBack:        () => void;
}

export function PipelineRunning({ projectId, environmentId, branch, onBack }: PipelineRunningProps) {
  const router = useRouter();

  const [stageStatuses, setStageStatuses] = useState<StageStatus[]>(
    Array(PIPELINE_STAGES.length).fill("pending"),
  );
  const [elapsed, setElapsed]     = useState(0);
  const [webUrl, setWebUrl]       = useState<string | null>(null);
  const [completedRun, setCompletedRun] = useState<TestRun | null>(null);
  const [error, setError]         = useState<string | null>(null);

  // Momento em que o trigger foi feito — usado para filtrar runs anteriores
  const triggeredAt  = useRef<string>(new Date().toISOString());
  const timers       = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  // Guard contra double-fire do React StrictMode (Next.js 15 ativa strict por padrão)
  const hasFiredRef  = useRef(false);
  // Ref do relógio — permite pará-lo de fora do closure do efeito principal
  const clockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Quando a pipeline conclui: para cronômetro + força todas as etapas "done" ──
  // Necessário porque a animação das etapas é baseada em timers fixos; se a pipeline
  // terminar antes dos 130s da etapa "tests", as etapas ficariam presas no meio.
  useEffect(() => {
    if (!completedRun) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStageStatuses(Array(PIPELINE_STAGES.length).fill("done"));
    if (clockTimerRef.current) {
      clearInterval(clockTimerRef.current);
      clockTimerRef.current = null;
    }
  }, [completedRun]);

  // ── Efeito principal: dispara pipeline + inicia animação + polling ──────────
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

    // 1. Dispara a pipeline no GitLab — guard evita double-fire do React StrictMode
    if (!hasFiredRef.current) {
      hasFiredRef.current = true;

      triggerPipeline({ project_id: projectId, environment_id: environmentId, branch })
        .then((res) => {
          setWebUrl(res.data.web_url);

          // 2. Inicia polling a cada 5s
          pollRef.current = setInterval(async () => {
            try {
              // Filtra diretamente no servidor: somente runs COMPLETED iniciados
              // após o momento em que o trigger foi feito. Evita comparação de
              // strings ISO com formatos diferentes (Z vs +00:00) e garante que
              // runs de pipelines anteriores não sejam confundidos com o atual.
              const page = await listRuns({
                project: projectId,
                ordering: "-started_at",
                status: "COMPLETED",
                started_at_after: triggeredAt.current,
              });
              const found = page.data.results[0] ?? null;
              if (found) {
                setCompletedRun(found);
                clearInterval(pollRef.current!);
                pollRef.current = null;
                // Cronômetro e etapas são parados pelo useEffect acima (on completedRun)
              }
            } catch (err: unknown) {
              // Para erros 4xx (ex: 400 filtro inválido) o polling não vai se
              // recuperar sozinho — interrompe para evitar spam de requisições
              const status = (err as { status?: number })?.status;
              if (status && status >= 400 && status < 500) {
                setError(`Erro ao consultar execuções (${status}). Verifique os parâmetros.`);
                clearInterval(pollRef.current!);
                pollRef.current = null;
                if (clockTimerRef.current) {
                  clearInterval(clockTimerRef.current);
                  clockTimerRef.current = null;
                }
              }
              // Erros 5xx ou de rede são transitórios — deixa o polling continuar
            }
          }, 5000);
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg);
          if (clockTimerRef.current) {
            clearInterval(clockTimerRef.current);
            clockTimerRef.current = null;
          }
        });
    }

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      if (clockTimerRef.current) {
        clearInterval(clockTimerRef.current);
        clockTimerRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isDone = completedRun !== null;

  const cardStyle: React.CSSProperties = {
    background: "var(--glass-card-bg)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: 12,
    border: "1px solid var(--glass-card-border)",
    boxShadow: "var(--glass-shadow)",
  };

  // ── Tela de erro ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ ...cardStyle, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>
          Erro ao disparar a pipeline
        </div>
        <div style={{ fontSize: 13, color: "var(--col-muted)", marginBottom: 24 }}>{error}</div>
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
              onClick={onBack}
              style={{
                padding: "7px 14px", borderRadius: 7,
                border: "1.5px solid #fca5a5", background: "#fee2e2",
                color: "#dc2626", fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              ✕ Cancelar
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
