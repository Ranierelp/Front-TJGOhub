// =============================================================================
// Hook de detalhe de uma execucao com seus resultados
//
// Dois useEffects separados:
//   1. Busca o cabecalho da run (raramente muda — roda so com runId)
//   2. Busca os resultados (re-executa com filtro e pagina)
//
// Por que separar? Se o usuario muda o filtro de resultados, nao precisa
// re-buscar os dados da run. Cada efeito e independente.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import {
  getRun,
  listRunResults,
  type TestRunDetail,
  type TestResult,
} from "@/lib/api/runs";

export type ResultStatusFilter = "all" | "PASSED" | "FAILED" | "SKIPPED" | "FLAKY";

const RESULTS_PAGE_SIZE = 10;

export function useRunDetail(runId: string) {
  const [run, setRun]                     = useState<TestRunDetail | null>(null);
  const [results, setResults]             = useState<TestResult[]>([]);
  const [isLoadingRun, setIsLoadingRun]   = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [statusFilter, setStatus]         = useState<ResultStatusFilter>("all");
  const [resultsPage, setResultsPage]     = useState(1);
  const [resultsTotal, setResultsTotal]   = useState(0);
  const [refreshKey, setRefreshKey]       = useState(0);

  // Efeito 1: cabecalho da run
  useEffect(() => {
    setIsLoadingRun(true);
    getRun(runId)
      .then((res) => setRun(res.data))
      .catch(() => setError("Execucao nao encontrada ou sem permissao de acesso."))
      .finally(() => setIsLoadingRun(false));
  }, [runId, refreshKey]);

  // Efeito 2: resultados (filtra e pagina de forma independente)
  useEffect(() => {
    setIsLoadingResults(true);
    const params = {
      page: resultsPage,
      ...(statusFilter !== "all" && { status: statusFilter }),
    };

    listRunResults(runId, params)
      .then((res) => {
        setResults(res.data.results);
        setResultsTotal(res.data.count);
      })
      .catch(() => setResults([]))
      .finally(() => setIsLoadingResults(false));
  }, [runId, statusFilter, resultsPage, refreshKey]);

  // Ao mudar o filtro de status, volta para pagina 1 dos resultados
  const setStatusFilter = useCallback((val: ResultStatusFilter) => {
    setStatus(val);
    setResultsPage(1);
  }, []);

  const totalResultsPages = Math.max(
    1,
    Math.ceil(resultsTotal / RESULTS_PAGE_SIZE),
  );

  return {
    run,
    results,
    isLoadingRun,
    isLoadingResults,
    error,
    statusFilter,
    setStatusFilter,
    resultsPagination: {
      page: resultsPage,
      totalPages: totalResultsPages,
      total: resultsTotal,
    },
    setResultsPage,
    refetch: () => setRefreshKey((k) => k + 1),
  };
}
