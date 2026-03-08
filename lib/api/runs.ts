// =============================================================================
// Servico de API para Execucoes (Runs) e Resultados (Results)
//
// Padrao identico a projects.ts:
//   - Interfaces espelham os serializers do backend
//   - Funcoes puras que chamam get/post do utils.ts
//   - DRFPage<T> para respostas paginadas
// =============================================================================

import { get, post } from "./utils";
import { api } from "./index";

// Resposta paginada padrao do DRF (igual a projects.ts, mas local para evitar
// dependencia cruzada entre modulos de API)
export interface DRFPage<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Tag associada a uma execucao
export interface RunTag {
  id: string;
  name: string;
  color: string;
}

// Execucao (run) resumida — usada na listagem
export interface TestRun {
  id: string;
  run_id: string;
  project: string;
  project_name: string;
  environment: string | null;
  environment_name: string | null;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  status_display: string;
  trigger_type: "manual" | "api" | "scheduled";
  trigger_type_display: string;
  branch: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  skipped_tests: number;
  flaky_tests: number;
  success_rate: number;
  duration_seconds: number | null;
  duration_formatted: string | null;
  started_at: string;
  completed_at: string | null;
  tags: RunTag[];
}

// Execucao detalhada — campos extras que so aparecem no GET /runs/{id}/
export interface TestRunDetail extends TestRun {
  commit_sha: string | null;
  commit_message: string | null;
  triggered_by_name: string | null;
  results_count: number;
}

// Resultado individual de um teste — versao resumida (listagem)
export interface TestResult {
  id: string;
  result_id: string;
  test_case: string | null;
  test_case_title: string | null;
  test_case_case_id: string | null;
  title: string;
  status: "PASSED" | "FAILED" | "SKIPPED" | "FLAKY";
  status_display: string;
  duration_seconds: number;
  duration_formatted: string;
  retry_number: number;
  error_summary: string | null;
  artifacts_count: number;
  executed_at: string;
}

// Resultado detalhado — inclui error_message e stack_trace completos
export interface TestResultDetail extends TestResult {
  error_message: string | null;
  stack_trace: string | null;
}

// Parametros de listagem de runs (viram query params na URL)
export interface ListRunsParams {
  page?: number;
  search?: string;
  status?: string;
  project?: string;
  branch?: string;
  ordering?: string;
}

// ── Funcoes de API ────────────────────────────────────────────────────────────

/** Lista execucoes com suporte a busca, filtros e paginacao */
export function listRuns(params: ListRunsParams = {}) {
  return get<DRFPage<TestRun>>(api.endpoints.runs, { params });
}

/** Busca o detalhe de uma execucao por UUID */
export function getRun(id: string) {
  return get<TestRunDetail>(`${api.endpoints.runs}${id}/`);
}

/** Lista resultados de uma execucao (paginado, com filtro de status) */
export function listRunResults(
  runId: string,
  params: { page?: number; status?: string } = {},
) {
  return get<DRFPage<TestResult>>(
    `${api.endpoints.runs}${runId}/results/`,
    { params },
  );
}

/** Busca o detalhe completo de um resultado (com error_message + stack_trace) */
export function getResult(id: string) {
  return get<TestResultDetail>(`${api.endpoints.results}${id}/`);
}

/** Marca um resultado como Flaky */
export function markResultAsFlaky(id: string) {
  return post<{ detail: string }>(
    `${api.endpoints.results}${id}/mark-as-flaky/`,
  );
}
