// =============================================================================
// Hook de detalhe de projeto
//
// Busca o projeto pelo UUID e expõe funções de mutação (arquivar, ativar).
// As funções de mutação retornam `true` em sucesso para o caller poder
// redirecionar ou atualizar o estado.
// =============================================================================

import { useState, useEffect } from "react";
import {
  getProject,
  archiveProject,
  activateProject,
  type ProjectDetail,
} from "@/lib/api/projects";

export function useProjectDetail(id: string) {
  const [project, setProject]   = useState<ProjectDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // Busca inicial do projeto
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    getProject(id)
      .then((resp) => setProject(resp.data))
      .catch(() => setError("Projeto não encontrado."))
      .finally(() => setLoading(false));
  }, [id]);

  // Arquiva e atualiza o estado local sem re-fetch
  async function archive(): Promise<boolean> {
    if (!project) return false;
    try {
      await archiveProject(project.id);
      setProject((prev) => prev ? { ...prev, is_active: false } : prev);
      return true;
    } catch {
      return false;
    }
  }

  // Reativa e atualiza o estado local
  async function activate(): Promise<boolean> {
    if (!project) return false;
    try {
      const resp = await activateProject(project.id);
      setProject(resp.data);
      return true;
    } catch {
      return false;
    }
  }

  return { project, loading, error, archive, activate };
}
