// =============================================================================
// Serviço de API para Projetos
//
// Centraliza todas as chamadas HTTP relacionadas a projetos.
// Seguindo o padrão da aplicação: funções puras que usam get/post/patch/del
// do utils.ts (que já tem retry, error handling e autenticação).
// =============================================================================

import { get, post, patch, del } from "./utils";
import { api } from "./index";

// Tipos que espelham o serializer do backend
export interface ProjectList {
  id: string;             // UUID
  name: string;
  slug: string;
  is_active: boolean;
  environments_count: number;
  test_cases_count: number;
  created_at: string;     // ISO 8601
  created_by_name?: string;
}

export interface ProjectDetail extends ProjectList {
  description: string;
  test_runs_count: number;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
}

// Resposta paginada do DRF
export interface DRFPage<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Parâmetros de listagem (mapeiam para query params do backend)
export interface ListProjectsParams {
  page?: number;
  search?: string;
  is_active?: boolean;    // filtro de status: true=ativo, false=arquivado
  ordering?: string;
}

// ── Funções de API ──────────────────────────────────────────────────────────

/** Lista projetos com suporte a busca e filtros */
export function listProjects(params: ListProjectsParams = {}) {
  return get<DRFPage<ProjectList>>(api.endpoints.projects, { params });
}

/** Busca o detalhe de um projeto por UUID */
export function getProject(id: string) {
  return get<ProjectDetail>(`${api.endpoints.projects}${id}/`);
}

/** Cria um novo projeto */
export function createProject(data: { name: string; description?: string }) {
  return post<ProjectDetail>(api.endpoints.projects, data);
}

/** Atualiza parcialmente um projeto (PATCH) */
export function updateProject(id: string, data: { name?: string; description?: string }) {
  return patch<ProjectDetail>(`${api.endpoints.projects}${id}/`, data);
}

/** Arquiva (soft delete) um projeto */
export function archiveProject(id: string) {
  return post<{ detail: string }>(`${api.endpoints.projects}${id}/archive/`);
}

/** Reativa um projeto arquivado */
export function activateProject(id: string) {
  return post<ProjectDetail>(`${api.endpoints.projects}${id}/activate/`);
}

/** Exclui permanentemente (hard delete via DELETE) */
export function deleteProject(id: string) {
  return del(`${api.endpoints.projects}${id}/`);
}
  