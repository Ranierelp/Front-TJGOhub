// =============================================================================
// Hook simples de listagem — um padrão comum no React
//
// useProjects() segue o mesmo padrão de useDashboardData(), mas sem
// dependências externas (não recebe parâmetros).
//
// Características deste hook:
//   - Busca uma única vez (useEffect com [])
//   - Não precisa de refetch manual (projetos raramente mudam)
//   - Retorna loading para o seletor mostrar estado de carregamento
//
// Nota: projetos são buscados com limit=100 porque são dados de configuração
// (não são milhares de registros) — não precisamos de paginação aqui.
// =============================================================================

import { useState, useEffect } from "react";

import { get, api } from "@/lib/api";

interface DRFList<T> {
  count:    number;
  results:  T[];
}

export interface Project {
  id:   string;
  name: string;
  slug: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    get<DRFList<Project>>(api.endpoints.projects, {
      params: { limit: 100, is_active: true, ordering: "name" },
    })
      .then((resp) => setProjects(resp.data.results))
      .catch(() => setProjects([])) // em caso de erro, mantém lista vazia
      .finally(() => setLoading(false));
  }, []);

  return { projects, loading };
}
