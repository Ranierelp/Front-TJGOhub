// =============================================================================
// Hook de listagem de casos de teste
//
// Responsabilidades:
//   1. Buscar casos da API com paginação (PAGE_SIZE=10 no backend)
//   2. Aplicar filtros: busca (debounced), status, projeto
//   3. Expor controles de página e filtro para o componente
//
// Paralelo Django: é como uma view de listagem que recebe GET params
// (?search=, ?status=, ?project=, ?page=) e retorna o queryset filtrado.
// =============================================================================

import { useState, useEffect } from "react";
import { get, api } from "@/lib/api";

export interface TestCaseRow {
  id:           string;
  project:      string;
  project_name: string;
  case_id:      string;
  title:        string;
  status:       "DRAFT" | "ACTIVE" | "DEPRECATED";
  module:       string;
  tags:         { id: string; name: string; color: string }[];
  created_at:   string;
}

interface DRFPage<T> { count: number; results: T[]; }

export function useCaseList() {
  const [cases,   setCases]   = useState<TestCaseRow[]>([]);
  const [count,   setCount]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);

  // Valor do input de busca (exibido imediatamente)
  const [search, setSearch] = useState("");
  // Valor debounced (aplicado na query após 400ms)
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [statusFilter,  setStatusFilter]  = useState("");
  const [projectFilter, setProjectFilter] = useState("");

  // Debounce: aguarda 400ms após o último keystroke para disparar a query
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Re-busca sempre que page, busca ou filtros mudam
  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page };
    if (debouncedSearch) params.search  = debouncedSearch;
    if (statusFilter)    params.status  = statusFilter;
    if (projectFilter)   params.project = projectFilter;

    get<DRFPage<TestCaseRow>>(api.endpoints.testCases, { params })
      .then(r => { setCases(r.data.results); setCount(r.data.count); })
      .catch(() => { setCases([]); setCount(0); })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, statusFilter, projectFilter]);

  // Ao trocar filtro de status ou projeto, volta para página 1
  const updateStatus  = (v: string) => { setStatusFilter(v);  setPage(1); };
  const updateProject = (v: string) => { setProjectFilter(v); setPage(1); };

  const totalPages = Math.max(1, Math.ceil(count / 10));

  return {
    cases, count, loading,
    page, setPage, totalPages,
    search, setSearch,
    statusFilter,  updateStatus,
    projectFilter, updateProject,
  };
}
