// =============================================================================
// Hook de ambientes por projeto
//
// Diferente do useProjects (que busca uma vez com deps=[]), este hook
// recebe projectId como parâmetro e re-busca SEMPRE que ele muda.
//
// Paralelo Django: é como um select_related — quando o usuário muda o projeto
// no frontend, precisamos buscar os ambientes daquele novo projeto.
//
// Fluxo:
//   1. Usuário seleciona projeto X
//   2. projectId muda → useEffect dispara
//   3. Busca GET /api/v1/environments/?project=X&is_active=true
//   4. Preenche o select de ambientes
// =============================================================================

import { useState, useEffect } from "react";
import { listEnvironments } from "@/lib/api/environments";
import type { EnvironmentItem } from "@/lib/api/environments";

export function useEnvironments(projectId: string | null) {
  const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    // Sem projeto selecionado → limpa lista sem fazer requisição
    if (!projectId) {
      setEnvironments([]);
      return;
    }

    setLoading(true);
    listEnvironments({ project: projectId, is_active: true })
      .then((res) => setEnvironments(res.data.results))
      .catch(() => setEnvironments([]))
      .finally(() => setLoading(false));
  }, [projectId]); // ← a dependência: re-executa quando projectId muda

  return { environments, loading };
}
