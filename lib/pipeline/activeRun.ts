// =============================================================================
// activeRun — persiste o "run ativo" da pipeline no localStorage
//
// PROBLEMA: o estado da tela de pipeline vive só em useState. Ao sair da rota,
// o componente desmonta e o estado some — ao voltar, a tela reinicia no
// formulário, mesmo com uma pipeline já rodando.
//
// SOLUÇÃO: no disparo, gravamos aqui o run_id (o "fio" para o backend) + os
// dados do formulário. Ao voltar, lemos este registro e reanexamos o polling
// ao MESMO run — sem re-disparar.
//
// Paralelo Django: pense num pequeno "cache" chaveado por sessão do navegador,
// com TTL, guardando só o suficiente para retomar o acompanhamento.
// =============================================================================

const STORAGE_KEY = "tjgohub:active-pipeline-run";
const TTL_MS = 15 * 60 * 1000; // 15 min — depois disso, não reanexa (run velho)

export interface ActivePipelineRun {
  runId:         string;       // UUID do TestRun no backend (usado no getRun)
  webUrl:        string | null; // link do pipeline no GitLab
  projectId:     string;
  environmentId: string;
  branch:        string;
  startedAt:     number;       // Date.now() no disparo — base do TTL e do cronômetro
}

// Grava o run ativo. Chamado logo após o disparo bem-sucedido.
export function saveActiveRun(run: ActivePipelineRun): void {
  if (typeof window === "undefined") return; // guarda contra SSR (sem localStorage)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
  } catch {
    // localStorage pode falhar (modo privado, cota) — não é crítico, seguimos.
  }
}

// Lê o run ativo, se houver e ainda estiver "fresco". Registro ausente,
// malformado ou expirado (> TTL) retorna null — e o expirado é descartado.
export function loadActiveRun(): ActivePipelineRun | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const run = JSON.parse(raw) as ActivePipelineRun;
    // Validação mínima do shape — se veio quebrado, trata como inexistente.
    if (!run || typeof run.runId !== "string" || typeof run.startedAt !== "number") {
      return null;
    }
    // Expirado: limpa e finge que não existe (evita reanexar a runs antigos).
    if (Date.now() - run.startedAt > TTL_MS) {
      clearActiveRun();
      return null;
    }
    return run;
  } catch {
    return null;
  }
}

// Remove o run ativo. Chamado em qualquer desfecho final ou ao cancelar.
export function clearActiveRun(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // idem saveActiveRun — falha silenciosa é aceitável aqui.
  }
}
