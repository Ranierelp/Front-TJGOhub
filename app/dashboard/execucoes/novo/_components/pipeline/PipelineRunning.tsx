// =============================================================================
// PipelineRunning — execução simulada com etapas + resultados ao vivo
//
// CONCEITO: useEffect com cleanup
//   setInterval cria um timer que executa a cada N milissegundos para sempre.
//   Se o componente for desmontado (usuário navegar para outra página), o timer
//   continua rodando — isso é um "memory leak" (vazamento de memória).
//
//   Solução: retornar uma função de cleanup no useEffect.
//   O React chama essa função automaticamente:
//     - Quando o componente é desmontado
//     - Antes de re-executar o efeito (se as deps mudaram)
//
//   useEffect(() => {
//     const timer = setInterval(() => { ... }, 1000);
//     return () => clearInterval(timer); // ← cleanup
//   }, []);
//
//   Paralelo Django: é como context managers (with) — o cleanup é o __exit__.
//
// CONCEITO: setTimeout com índice simulado
//   Para simular resultados aparecendo em tempo real, usamos setTimeout
//   com delay crescente: resultado 1 aparece em 4s, resultado 2 em 8s, etc.
//   Os timeouts são armazenados em um array e todos cancelados no cleanup.
//
// TODO: Substituir toda a simulação por:
//   1. POST /api/v1/runs/trigger-pipeline/ → recebe run_id
//   2. Polling: GET /api/v1/runs/{run_id}/ a cada 3s até COMPLETED
//   3. Resultados: GET /api/v1/runs/{run_id}/results/ com paginação
// =============================================================================

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getStatusStyle } from "@/lib/statusConfig";

// TODO: substituir por dados reais quando backend tiver trigger-pipeline
const MOCK_RESULTS = [
  { title: "Login com credenciais válidas",  status: "PASSED", duration: "1.2s", module: "auth",       delay: 4000  },
  { title: "Emitir Guia de Agravo",          status: "PASSED", duration: "3.1s", module: "guias",      delay: 8000  },
  { title: "Depositar valor no processo",    status: "FAILED", duration: "4.8s", module: "financeiro", delay: 14000 },
  { title: "Validar campo Observação",       status: "PASSED", duration: "2.3s", module: "processos",  delay: 18000 },
  { title: "Parcelamento da Guia",           status: "FLAKY",  duration: "2.9s", module: "guias",      delay: 22000 },
  { title: "Buscar múltiplas guias",         status: "PASSED", duration: "1.5s", module: "guias",      delay: 25000 },
  { title: "Cadastrar Tipo de Guia",         status: "PASSED", duration: "0.9s", module: "guias",      delay: 28000 },
  { title: "Consulta de tipo de guia",       status: "FAILED", duration: "7.9s", module: "guias",      delay: 37000 },
] as const;

const PIPELINE_STAGES = [
  { id: "setup",   name: "Setup ambiente",              icon: "⚙",  duration: "~5s",   delay: 0 },
  { id: "install", name: "Instalar dependências",       icon: "📦", duration: "~15s",  delay: 2000 },
  { id: "tests",   name: "Executar testes Playwright",  icon: "🧪", duration: "~2min", delay: 6000 },
  { id: "report",  name: "Gerar relatório",             icon: "📊", duration: "~3s",   delay: 42000 },
  { id: "upload",  name: "Enviar resultados ao Hub",    icon: "☁",  duration: "~2s",   delay: 45000 },
];

type StageStatus = "pending" | "running" | "done";

interface MockResult {
  title:    string;
  status:   string;
  duration: string;
  module:   string;
}

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
  const [visibleResults, setVisibleResults] = useState<MockResult[]>([]);
  const [elapsed, setElapsed]   = useState(0);
  const [isDone, setIsDone]     = useState(false);

  // useRef para guardar IDs dos timers sem causar re-render
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Timer do relógio (incrementa a cada segundo)
    const clockTimer = setInterval(() => setElapsed((s) => s + 1), 1000);
    timers.current.push(clockTimer as unknown as ReturnType<typeof setTimeout>);

    // Simula progressão das etapas com setTimeout
    PIPELINE_STAGES.forEach((stage, i) => {
      const startTimer = setTimeout(() => {
        setStageStatuses((prev) => {
          const next = [...prev];
          next[i] = "running";
          return next;
        });
      }, stage.delay);

      const doneDelay = i < PIPELINE_STAGES.length - 1
        ? PIPELINE_STAGES[i + 1].delay
        : stage.delay + 3000;

      const doneTimer = setTimeout(() => {
        setStageStatuses((prev) => {
          const next = [...prev];
          next[i] = "done";
          return next;
        });
      }, doneDelay);

      timers.current.push(startTimer, doneTimer);
    });

    // Simula resultados aparecendo um a um
    MOCK_RESULTS.forEach((r) => {
      const t = setTimeout(() => {
        setVisibleResults((prev) => [...prev, r]);
      }, r.delay);
      timers.current.push(t);
    });

    // Marca como concluído após todas as etapas
    const doneTimer = setTimeout(() => {
      setIsDone(true);
      clearInterval(clockTimer);
    }, 48000);
    timers.current.push(doneTimer);

    // CLEANUP: cancela todos os timers ao desmontar o componente
    // Sem isso, os timers continuariam rodando após sair da página
    return () => {
      timers.current.forEach(clearTimeout);
      clearInterval(clockTimer);
    };
  }, []); // deps=[]: roda só uma vez quando o componente monta

  const passed = visibleResults.filter((r) => r.status === "PASSED").length;
  const failed = visibleResults.filter((r) => r.status === "FAILED").length;
  const flaky  = visibleResults.filter((r) => r.status === "FLAKY").length;

  const cardStyle: React.CSSProperties = {
    background: "var(--glass-card-bg)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: 12,
    border: "1px solid var(--glass-card-border)",
    boxShadow: "var(--glass-shadow)",
  };

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
            <div style={{ fontSize: 12, color: "var(--col-muted)" }}>
              {branch}
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

      {/* Conteúdo: sidebar de etapas + resultados ao vivo */}
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

        {/* Área de resultados ao vivo */}
        <div>
          {/* Métricas ao vivo */}
          {visibleResults.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
              {[
                { label: "Total",  value: visibleResults.length, color: "#2563eb" },
                { label: "Passou", value: passed,                color: "#16a34a" },
                { label: "Falhou", value: failed,                color: "#dc2626" },
                { label: "Flaky",  value: flaky,                 color: "#ca8a04" },
              ].map((m) => (
                <div key={m.label} style={{ ...cardStyle, padding: "10px 14px", borderTop: `3px solid ${m.color}` }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{m.value}</span>
                  <span style={{ fontSize: 11, color: "var(--col-dim)", marginLeft: 6 }}>{m.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Barra de progresso */}
          {visibleResults.length > 0 && (
            <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 12, background: "var(--glass-field-bg)" }}>
              {passed > 0 && <div style={{ width: `${(passed / visibleResults.length) * 100}%`, background: "#16a34a", transition: "width 0.5s" }} />}
              {flaky  > 0 && <div style={{ width: `${(flaky  / visibleResults.length) * 100}%`, background: "#ca8a04", transition: "width 0.5s" }} />}
              {failed > 0 && <div style={{ width: `${(failed / visibleResults.length) * 100}%`, background: "#dc2626", transition: "width 0.5s" }} />}
            </div>
          )}

          {/* Label "Resultados ao vivo" */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--col-label)", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            Resultados ao vivo
            {!isDone && (
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#dc2626", display: "inline-block", animation: "pulse 1s infinite" }} />
            )}
          </div>

          {/* Placeholder enquanto aguarda */}
          {visibleResults.length === 0 && !isDone && (
            <div style={{ ...cardStyle, padding: "40px 20px", textAlign: "center", color: "var(--col-dim)", fontSize: 13 }}>
              <div style={{ animation: "pulse 1.5s infinite", fontSize: 26, marginBottom: 10 }}>🧪</div>
              Aguardando os testes iniciarem...
            </div>
          )}

          {/* Lista de resultados */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {visibleResults.map((r, i) => {
              const s = getStatusStyle(r.status);
              return (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", background: "var(--glass-card-bg)",
                    borderRadius: 8, border: "1px solid var(--glass-card-border)",
                    borderLeft: `4px solid ${s.color}`,
                    animation: "fadeUp 0.25s ease",
                  }}
                >
                  <span style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    background: s.bg, color: s.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {s.icon}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--col-heading)" }}>{r.title}</span>
                  <span style={{ fontSize: 11, color: "var(--col-dim)", fontFamily: "monospace" }}>{r.module}</span>
                  <span style={{ fontSize: 11, color: "var(--col-muted)", fontFamily: "monospace" }}>{r.duration}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: s.bg, color: s.color, textTransform: "uppercase" as const }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Botões pós-conclusão */}
          {isDone && (
            <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "center" }}>
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
                ← Voltar às Execuções
              </button>
              {/* TODO: navegar para /execucoes/{id} real quando backend tiver trigger-pipeline */}
              <button
                onClick={() => router.push("/dashboard/execucoes")}
                style={{
                  padding: "10px 24px", borderRadius: 8, border: "none",
                  background: "#2563eb", color: "white",
                  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Ver Execuções →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
