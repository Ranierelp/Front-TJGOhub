// =============================================================================
// CONCEITO 1: Custom Hook — encapsulando lógica de dados
//
// Um custom hook é uma função que começa com "use" e pode chamar outros hooks.
// Ele extrai a lógica de dados do componente, deixando o componente limpo.
//
//   SEM hook (tudo no componente):          COM hook:
//   function DashboardClient() {           function DashboardClient() {
//     const [data, setData] = ...            const { data, loading } =
//     const [loading, ...] = ...              useDashboardData(projectId);
//     useEffect(() => { fetch... }, [])     return <Cards data={data} />;
//     return <Cards data={data} />;        }
//   }
//
// Paralelo Django: é como mover a lógica de queryset de uma view para
// um Manager ou um serviço — a view fica só com render/response.
//
// CONCEITO 2: Promise.all — chamadas paralelas à API
//
// Em vez de buscar um dado, esperar, depois buscar outro (serial):
//   const runs     = await get(...)  // espera 200ms
//   const failures = await get(...)  // espera 200ms → total: 400ms
//
// Fazemos tudo ao mesmo tempo (paralelo):
//   const [runs, failures, flaky] = await Promise.all([...]) // total: ~200ms
//
// Promise.all recebe um array de Promises e resolve quando TODAS terminam.
// Se UMA falhar, ele rejeita com o erro daquela promessa.
//
// Paralelo Python: asyncio.gather() — executa coroutines em paralelo.
//
// CONCEITO 3: Race Conditions e useEffect cleanup
//
// Problema: usuário troca projeto A → B rapidamente.
//   1. Projeto A → requisição A enviada (200ms)
//   2. Projeto B → requisição B enviada (100ms)
//   3. Req B chega primeiro → dados de B aparecem
//   4. Req A chega depois  → dados de A SOBRESCREVEM B! (bug sutil)
//
// Solução: flag `cancelled` no cleanup do useEffect.
//   O return do useEffect é a "função de limpeza" — roda quando:
//     a) o componente desmonta
//     b) o useEffect vai rodar de novo (dependências mudaram)
//   Marcamos cancelled=true nesse cleanup, e ignoramos a resposta da req antiga.
//
// Paralelo Python: asyncio.Task.cancel() — cancela uma coroutine obsoleta.
// =============================================================================

import { useState, useEffect } from "react";

import { get, api } from "@/lib/api";
import type { Run } from "@/app/dashboard/_components/LastRunCard";
import type { FailureItem } from "@/app/dashboard/_components/TopFailuresCard";
import type { FlakyItem } from "@/app/dashboard/_components/TopFlakyCard";
import type { TrendDataPoint } from "@/app/dashboard/_components/TrendChartCard";

// =============================================================================
// Tipos que espelham o formato real da API Django (DRF)
//
// O DRF retorna listas no formato paginado:
//   { count: 50, next: "...", previous: null, results: [...] }
// =============================================================================

interface DRFList<T> {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  T[];
}

interface ApiRun {
  id:                 string;
  project_name:       string;
  environment_name:   string;
  status:             "COMPLETED" | "FAILED" | "RUNNING" | "PENDING" | "CANCELLED";
  started_at:         string | null;
  duration_formatted: string;
  success_rate:       number;
  passed_tests:       number;
  failed_tests:       number;
  skipped_tests:      number;
  flaky_tests:        number;
}

interface ApiResult {
  id:              string;
  result_id:       string;
  test_case_title: string | null;
  status:          "PASSED" | "FAILED" | "SKIPPED" | "FLAKY";
}

export interface DashboardData {
  lastRun:  Run | null;
  passRate: { passed: number; failed: number; skipped: number };
  failures: FailureItem[];
  flaky:    FlakyItem[];
  trend:    TrendDataPoint[];
}

export interface UseDashboardDataReturn {
  data:    DashboardData | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

// =============================================================================
// Helpers — funções puras fora do hook
// =============================================================================

function formatDateLabel(isoDate: string | null): string {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Agrega resultados por nome e ordena pelos mais frequentes
// Paralelo Python: Counter(r.title for r in results).most_common(limit)
function aggregateByTitle(results: ApiResult[], limit: number): { name: string; count: number }[] {
  const counts = results.reduce<Record<string, number>>((acc, r) => {
    const name = r.test_case_title || r.result_id;
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

// =============================================================================
// O hook principal
//
// Novidade em relação ao Passo 6: aceita `projectId` como parâmetro.
// Quando projectId muda, o useEffect detecta e re-busca os dados filtrados.
//
// `refreshKey` é um contador que força o useEffect a rodar de novo quando
// o usuário clica em "Tentar novamente" — mesmo sem mudar o projectId.
// =============================================================================

export function useDashboardData(projectId?: string): UseDashboardDataReturn {
  const [data, setData]           = useState<DashboardData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // CONCEITO 3 aplicado — flag que sinaliza "esse ciclo do efeito foi cancelado"
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        // Monta URL e params das runs conforme projeto selecionado
        const runsUrl = projectId
          ? `${api.endpoints.runs}by-project/${projectId}/`
          : api.endpoints.runs;

        const runParams: Record<string, unknown> = {
          ordering: "-started_at",
          limit:    7,
        };

        // CONCEITO 2 aplicado — 3 requisições em paralelo
        const [runsResp, failuresResp, flakyResp] = await Promise.all([
          get<DRFList<ApiRun>>(runsUrl, { params: runParams }),
          get<DRFList<ApiResult>>(api.endpoints.results, {
            params: { status: "FAILED", ordering: "-executed_at", limit: 50 },
          }),
          get<DRFList<ApiResult>>(api.endpoints.results, {
            params: { status: "FLAKY", ordering: "-executed_at", limit: 50 },
          }),
        ]);

        // CONCEITO 3: descarta resultado se o efeito foi cancelado
        if (cancelled) return;

        const runs    = runsResp.data.results;
        const lastRun = runs[0] ?? null;

        const lastRunCard: Run | null = lastRun
          ? {
              id:                 lastRun.id,
              project_name:       lastRun.project_name,
              environment_name:   lastRun.environment_name,
              status:             lastRun.status,
              started_at:         lastRun.started_at ?? "",
              duration_formatted: lastRun.duration_formatted,
              success_rate:       lastRun.success_rate,
            }
          : null;

        const passRate = lastRun
          ? { passed: lastRun.passed_tests, failed: lastRun.failed_tests, skipped: lastRun.skipped_tests }
          : { passed: 0, failed: 0, skipped: 0 };

        const failures: FailureItem[] = aggregateByTitle(failuresResp.data.results, 5);

        const flakyAgg = aggregateByTitle(flakyResp.data.results, 4);
        const flaky: FlakyItem[] = flakyAgg.map(({ name, count }) => ({
          name,
          failures:   count,
          total_runs: runs.length,
        }));

        const trend: TrendDataPoint[] = [...runs].reverse().map((run) => ({
          date:         formatDateLabel(run.started_at),
          passed:       run.passed_tests,
          failed:       run.failed_tests,
          flaky:        run.flaky_tests,
          skipped:      run.skipped_tests,
          success_rate: run.success_rate,
        }));

        setData({ lastRun: lastRunCard, passRate, failures, flaky, trend });

      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : (err as { message?: string }).message ?? "Erro ao carregar dados";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();

    // Cleanup: cancela resultado de requisição obsoleta (CONCEITO 3)
    return () => { cancelled = true; };

  // Roda novamente quando: projeto muda OU usuário clica em "Tentar novamente"
  }, [projectId, refreshKey]);

  return {
    data,
    loading,
    error,
    refetch: () => setRefreshKey((k) => k + 1),
  };
}
