// =============================================================================
// Hook de listagem de execucoes com busca (debounced), filtro e paginacao
//
// Padrao identico ao useProjectList.ts:
//   - Estado local gerenciado com useState
//   - useEffect re-busca quando filtros mudam
//   - useCallback estabiliza referencias dos setters (evita re-renders)
//   - refreshKey permite recarregar sem mudar os outros filtros
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { listRuns, type TestRun, type ListRunsParams } from "@/lib/api/runs";

export type RunStatusFilter =
  | "all"
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

const PAGE_SIZE = 20;

export function useRuns(projectId?: string) {
  const [runs, setRuns]             = useState<TestRun[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [statusFilter, setStatus]   = useState<RunStatusFilter>("all");
  // search tem dois estados: o que o usuario digita (imediato) e o que vai
  // para a API (debounced 400ms). Assim a UI responde na hora mas nao
  // dispara um fetch por tecla pressionada.
  const [searchInput, setSearchInput] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debounce: espera 400ms apos o usuario parar de digitar
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchInput), 400);
    return () => clearTimeout(timer); // cancela o timer se digitar de novo
  }, [searchInput]);

  // Busca principal — re-executa quando qualquer dependencia mudar
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const params: ListRunsParams = {
      page,
      ordering: "-started_at",
      ...(searchDebounced && { search: searchDebounced }),
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(projectId && { project: projectId }),
    };

    listRuns(params)
      .then((res) => {
        setRuns(res.data.results);
        setTotal(res.data.count);
      })
      .catch(() => setError("Erro ao carregar execucoes. Tente novamente."))
      .finally(() => setIsLoading(false));
  }, [page, searchDebounced, statusFilter, projectId, refreshKey]);

  // Setters estabilizados — resetam para pagina 1 ao mudar filtros
  const setSearch = useCallback((val: string) => {
    setSearchInput(val);
    setPage(1);
  }, []);

  const setStatusFilter = useCallback((val: RunStatusFilter) => {
    setStatus(val);
    setPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    runs,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    // Expoe searchInput (valor imediato) para o input e searchDebounced para info
    search: searchInput,
    setSearch,
    pagination: { page, totalPages, total },
    setPage,
    refetch: () => setRefreshKey((k) => k + 1),
  };
}
