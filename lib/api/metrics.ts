// =============================================================================
// Serviço de API para Métricas do Dashboard
//
// Um único endpoint substitui as 3 chamadas antigas do dashboard:
//   GET /api/v1/metrics/dashboard-summary/?project=<uuid>&days=7
//
// Os tipos abaixo espelham EXATAMENTE o dict montado pelo backend em
// apps/metrics/services.py — se um lado mudar, o outro precisa acompanhar.
//
// Os tipos moram AQUI (lib/) e não nos componentes — hooks e componentes
// importam daqui, mantendo a hierarquia lib → hooks → app (REVIEW.md, item 7).
// =============================================================================

import { get } from "./utils";

// ── Faixa 1: KPIs ────────────────────────────────────────────────────────────
export interface DashboardKpis {
  success_rate:       number | null;  // null = sem runs no período
  success_rate_delta: number | null;  // vs. janela anterior de mesmo tamanho
  automation_coverage: {
    percentage: number;
    automated:  number;
    total:      number;
  };
  critical_failures: {
    count:          number;  // casos CRITICAL com FAILED no período
    total_critical: number;  // total de casos CRITICAL ativos
  };
  flaky_rate: number;        // % de resultados FLAKY no período
}

// ── Faixa 2: saúde por projeto ───────────────────────────────────────────────
export interface ProjectHealth {
  id:              string;
  name:            string;
  last_run_status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | null;
  last_run_at:     string | null;   // ISO 8601
  success_rate:    number | null;   // agregado do período; null = sem runs
  failures:        number;
  flaky:           number;
}

// ── Faixa 3: análises ────────────────────────────────────────────────────────
export interface TopFailure {
  title:    string;
  count:    number;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | null; // null = sem caso vinculado
  case_id:  string | null;  // UUID do TestCase → link para /dashboard/casos/{id}
}

export interface TopFlaky {
  title:       string;
  flaky_count: number;
  total:       number;
  rate:        number;  // 0-100, já calculado no backend
}

export interface WorkloadItem {
  assignee: string | null;  // null → exibir "Sem responsável"
  count:    number;
}

// ── Faixa 4: tendência diária ────────────────────────────────────────────────
export interface TrendPoint {
  date:    string;  // "2026-07-21" (ISO, só a data)
  passed:  number;
  failed:  number;
  flaky:   number;
  skipped: number;
}

// ── Resposta completa ────────────────────────────────────────────────────────
export interface DashboardSummary {
  kpis:                 DashboardKpis;
  projects_health:      ProjectHealth[];
  top_failures:         TopFailure[];
  top_flaky:            TopFlaky[];
  workload_by_assignee: WorkloadItem[];
  trend:                TrendPoint[];
}

export interface DashboardSummaryParams {
  project?: string;       // UUID — omitir = todos os projetos
  days?:    7 | 14 | 30;  // período; o backend valida e usa 7 como padrão
}

/** Busca o resumo agregado do dashboard em uma única chamada */
export function getDashboardSummary(params: DashboardSummaryParams = {}) {
  return get<DashboardSummary>("/api/v1/metrics/dashboard-summary/", { params });
}
