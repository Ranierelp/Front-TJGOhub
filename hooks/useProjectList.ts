// =============================================================================
// Hook de listagem de projetos com busca, filtro e paginação
//
// Padrão: estado local + useEffect que re-busca quando filtros mudam.
// O `useCallback` nos setters estabiliza referências para evitar re-renders.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { listProjects, type ProjectList } from "@/lib/api/projects";

export type StatusFilter = "all" | "active" | "archived";

export function useProjectList() {
  const [projects, setProjects]   = useState<ProjectList[]>([]);
  const [count, setCount]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState<StatusFilter>("all");
  // refreshKey garante re-fetch mesmo quando os outros filtros não mudam
  const [refreshKey, setRefreshKey] = useState(0);

  // Busca quando qualquer dependência mudar
  useEffect(() => {
    setLoading(true);

    // Monta o parâmetro is_active baseado no filtro
    const isActive =
      statusFilter === "active"   ? true  :
      statusFilter === "archived" ? false :
      undefined; // "all" → sem filtro

    listProjects({ page, search: search || undefined, is_active: isActive })
      .then((resp) => {
        setProjects(resp.data.results);
        setCount(resp.data.count);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter, refreshKey]);

  // Resetar para página 1 quando busca/filtro mudar
  const updateSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const updateStatus = useCallback((value: StatusFilter) => {
    setStatus(value);
    setPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(count / 10));

  const refetch = () => setRefreshKey((k) => k + 1);

  return {
    projects, count, loading,
    page, setPage, totalPages,
    search, setSearch: updateSearch,
    statusFilter, setStatusFilter: updateStatus,
    refetch,
  };
}
