// =============================================================================
// Serviço de API para Ambientes
// =============================================================================

import { get, post, del } from "./utils";
import { api } from "./index";

// Retornado pelo EnvironmentListSerializer (action list)
export interface EnvironmentItem {
  id:               string;
  base_url:         string;
  env_type:         "development" | "staging" | "production";
  env_type_display: string;
  is_active:        boolean;
}

// Retornado pelo EnvironmentSerializer (create / retrieve)
export interface EnvironmentDetail extends EnvironmentItem {
  project:         string;
  project_name:    string;
  test_runs_count: number;
  created_at:      string;
  updated_at:      string;
}

interface DRFPage<T> { count: number; results: T[]; }

/** Lista ambientes, opcionalmente filtrando por projeto */
export function listEnvironments(params: { project?: string; is_active?: boolean } = {}) {
  return get<DRFPage<EnvironmentItem>>(api.endpoints.environments, { params });
}

/** Cria um novo ambiente */
export function createEnvironment(data: { project: string; base_url: string; env_type: string }) {
  return post<EnvironmentDetail>(api.endpoints.environments, data);
}

/** Arquiva (soft delete) um ambiente via DELETE */
export function archiveEnvironment(id: string) {
  return del(`${api.endpoints.environments}${id}/`);
}
