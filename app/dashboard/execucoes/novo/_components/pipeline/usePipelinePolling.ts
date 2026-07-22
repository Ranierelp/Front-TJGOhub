// =============================================================================
// usePipelinePolling — dispara a pipeline (ou reanexa) e acompanha o run por id
//
// Dois caminhos de entrada:
//   • SEM restore → dispara a pipeline (POST trigger), recebe o UUID do TestRun
//     criado (PENDING) e GRAVA esse run no localStorage (via saveActiveRun).
//   • COM restore → NÃO dispara nada; só reanexa o polling ao run já existente
//     (o usuário saiu e voltou para a tela). O run_id vem do localStorage.
//
// Em ambos, o polling lê GET /runs/{id}/ — vínculo determinístico, sem palpite.
// Em qualquer desfecho final, limpamos o run persistido (clearActiveRun).
//
// Conceito React: um "custom hook" é só uma função que usa outros hooks.
// Serve para tirar lógica de dados do componente (que fica só com a UI) —
// papel parecido com o de um service no Django.
// =============================================================================

"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { triggerPipeline, getRun, getPipelineStatus, TestRun } from "@/lib/api/runs";
import { extractDrfError } from "@/lib/api/utils";
import { saveActiveRun, clearActiveRun } from "@/lib/pipeline/activeRun";

const POLL_INTERVAL_MS = 5000;   // consulta o run a cada 5s
const GITLAB_CHECK_EVERY = 6;    // a cada 6 ticks (~30s) confere o GitLab
const MAX_TICKS = 120;           // 120 × 5s = 10 min → timeout

// Quando a tela é restaurada, recebemos o run já disparado (sem re-disparar).
interface Restore {
  runId:  string;
  webUrl: string | null;
}

export function usePipelinePolling(
  projectId: string,
  environmentId: string,
  branch: string,
  restore?: Restore,
) {
  const [webUrl, setWebUrl]             = useState<string | null>(restore?.webUrl ?? null);
  // runId exposto para permitir cancelar o run (Hub + GitLab). Já conhecido no
  // caminho de restauração; no disparo, chega quando o triggerPipeline resolve.
  const [runId, setRunId]               = useState<string | null>(restore?.runId ?? null);
  const [completedRun, setCompletedRun] = useState<TestRun | null>(null);
  // Três desfechos distintos, cada um com sua tela:
  const [error, setError]     = useState<string | null>(null); // o DISPARO falhou (GitLab nem recebeu)
  const [failure, setFailure] = useState<string | null>(null); // a PIPELINE falhou (disparou, mas quebrou)
  const [timedOut, setTimedOut] = useState(false);             // 10 min sem desfecho

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Guard contra double-fire do React StrictMode (Next.js 15 monta 2x em dev)
  const hasFiredRef = useRef(false);

  useEffect(() => {
    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    // Inicia o acompanhamento de um run EXATO por id (usado nos dois caminhos).
    const startPolling = (runId: string) => {
      stopPolling(); // defensivo: nunca deixa dois intervals rodando
      let ticks = 0;
      pollRef.current = setInterval(async () => {
        ticks += 1;

        if (ticks > MAX_TICKS) {
          stopPolling();
          clearActiveRun();      // desfecho final → não reanexa mais
          setTimedOut(true);
          return;
        }

        try {
          const { data: run } = await getRun(runId);

          if (run.status === "COMPLETED") {
            stopPolling();
            clearActiveRun();
            setCompletedRun(run);
            return;
          }
          if (run.status === "FAILED" || run.status === "CANCELLED") {
            stopPolling();
            clearActiveRun();
            setFailure("A execução terminou sem resultados. Veja os logs no GitLab.");
            return;
          }

          // Run ainda PENDING: a pipeline pode ter morrido ANTES de o reporter
          // enviar o relatório (build quebrado, etc). De tempos em tempos
          // pedimos ao backend que confira o GitLab — se falhou, ele marca
          // o run como FAILED e devolve o status atualizado.
          if (run.status === "PENDING" && ticks % GITLAB_CHECK_EVERY === 0) {
            const { data: ps } = await getPipelineStatus(runId);
            if (ps.run_status === "FAILED") {
              stopPolling();
              clearActiveRun();
              setFailure("A pipeline falhou no GitLab antes de gerar o relatório.");
            }
          }
        } catch {
          // Erros de rede/5xx são transitórios — o próximo tick tenta de novo.
          // O timeout de 10 min garante que isso não vira loop eterno.
        }
      }, POLL_INTERVAL_MS);
    };

    // ── Caminho A: restauração ── reanexa sem disparar nada de novo. ──────────
    // Fica ANTES do guard de propósito: reanexar o polling é idempotente e
    // PRECISA rodar em toda montagem. No StrictMode (dev monta 2x), o interval
    // da 1ª montagem é limpo no cleanup; se este trecho ficasse atrás do guard,
    // a 2ª montagem sairia cedo e o polling nunca recomeçaria — a tela ficaria
    // presa em "rodando" sem detectar o fim da pipeline.
    if (restore) {
      setWebUrl(restore.webUrl);
      startPolling(restore.runId);
      return stopPolling;
    }

    // ── Caminho B: disparo normal ── efeito colateral REAL (POST), por isso
    // protegido contra o double-fire do StrictMode. Aqui o interval nasce dentro
    // do .then (assíncrono), depois da dança de montagem, então não é limpo.
    if (hasFiredRef.current) return stopPolling;
    hasFiredRef.current = true;

    triggerPipeline({ project_id: projectId, environment_id: environmentId, branch })
      .then((res) => {
        // O "fio": UUID do TestRun que o backend criou junto com o disparo
        const runId = res.data.id;
        setRunId(runId);
        setWebUrl(res.data.web_url);
        // Persiste para sobreviver a sair/voltar (e F5) enquanto roda.
        saveActiveRun({
          runId,
          webUrl: res.data.web_url,
          projectId,
          environmentId,
          branch,
          startedAt: Date.now(),
        });
        startPolling(runId);
      })
      .catch((err: unknown) => {
        // O cliente HTTP rejeita com ApiError ({message, status, details}) —
        // um objeto simples, NÃO instância de Error. A mensagem real do
        // backend (ex.: "GitLab recusou a requisição...") vem em `details`,
        // e o extractDrfError sabe garimpá-la em qualquer shape do DRF.
        const apiErr = err as { message?: string; details?: unknown };
        const msg = extractDrfError(
          apiErr?.details,
          apiErr?.message || "Não foi possível disparar a pipeline.",
        );
        clearActiveRun(); // o disparo falhou — nada a reanexar
        toast.error(msg);
        setError(msg);
      });

    return stopPolling; // limpa o interval se o componente desmontar
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // "Settled" = qualquer desfecho final (sucesso, falha, erro ou timeout)
  const isSettled = Boolean(completedRun || error || failure || timedOut);

  return { runId, webUrl, completedRun, error, failure, timedOut, isSettled };
}
