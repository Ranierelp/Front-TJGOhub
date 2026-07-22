
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
  started_at: string | null;   // NULL em runs PENDING (pipeline ainda não iniciou)
  completed_at: string | null;
  created_at: string;   // sempre preenchido (criação/disparo) — base da ordenação
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
  /** Filtra por múltiplos status de uma vez (CSV). Ex.: "PENDING,RUNNING" */
  status__in?: string;
  project?: string;
  branch?: string;
  ordering?: string;
  started_at_after?: string;
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

// Resposta do POST /api/v1/runs/upload-report/
// O backend retorna 202 Accepted — o parse roda em background via Celery.
// Por isso status é sempre "PENDING" imediatamente após o upload.
export interface UploadReportResponse {
  run_id: string;   // ex: "run-20260313-001" — ID legível humano
  id:     string;   // UUID do TestRun no banco
  status: "PENDING";
  detail: string;   // mensagem informativa
}

/** Envia o JSON do relatório Playwright para processamento em background */
export function uploadReport(data: unknown) {
  return post<UploadReportResponse>(api.endpoints.uploadReport, data);
}

// Resposta do POST /api/v1/runs/trigger-pipeline/
// O backend cria um TestRun PENDING, chama o GitLab API e devolve AMBOS:
// os dados da pipeline E os IDs do run recem-criado. O `id` (UUID) e o "fio"
// que liga o disparo ao resultado — o polling consulta GET /runs/{id}/ direto.
export interface TriggerPipelineResponse {
  run_id:             string;  // ID legivel humano (ex: "run-20260313-001")
  id:                 string;  // UUID do TestRun — usado no polling por id
  gitlab_pipeline_id: number;  // ID numerico da pipeline no GitLab
  web_url:            string;  // link direto para a pipeline no GitLab
  status:             string;  // status inicial: "created" | "pending" | "running"
}

/** Dispara uma pipeline no GitLab CI a partir do TJGOHub */
export function triggerPipeline(data: {
  project_id:     string;
  environment_id: string;
  branch:         string;
}) {
  return post<TriggerPipelineResponse>("/api/v1/runs/trigger-pipeline/", data);
}

// Resposta do GET /api/v1/runs/{id}/pipeline-status/
// O backend consulta o GitLab (proxy — o token nunca chega ao navegador) e,
// se a pipeline morreu antes do reporter enviar o relatorio, marca o run
// como FAILED. Serve para o frontend detectar falha sem esperar para sempre.
export interface PipelineStatusResponse {
  gitlab_status: string;                // "running" | "success" | "failed" | "canceled" | ...
  run_status:    TestRun["status"];     // status do TestRun apos a checagem
  web_url:       string;                // link da pipeline no GitLab
}

/** Consulta o status real da pipeline GitLab vinculada a um run */
export function getPipelineStatus(id: string) {
  return get<PipelineStatusResponse>(
    `${api.endpoints.runs}${id}/pipeline-status/`,
  );
}

/**
 * Cancela uma execução. Além de marcar o run como CANCELLED no Hub, o backend
 * também cancela a pipeline no GitLab (quando o run veio de trigger-pipeline).
 */
export function cancelRun(id: string) {
  return post<TestRunDetail>(`${api.endpoints.runs}${id}/cancel/`, {});
}
