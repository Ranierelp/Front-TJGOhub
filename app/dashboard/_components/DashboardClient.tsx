// =============================================================================
// DashboardClient — orquestrador do dashboard gerencial (redesign)
//
// Central de comando do QA lead, em 4 faixas:
//   1. KpiCards            → 4 números de impacto imediato
//   2. ProjectsHealthTable → saúde de todos os projetos (some com filtro)
//   3. Análise (3 colunas) → top falhas · top instáveis · carga por responsável
//   4. TrendChartCard      → tendência diária com período funcional
//
// Estado que vive AQUI (lifting state up):
//   - projectId → afeta o hook (re-busca) e a visibilidade da Faixa 2
//   - days      → afeta o hook E o select do TrendChartCard (controlado)
//
// Todos os dados vêm de UMA chamada (useDashboardSummary) — as 3 chamadas
// paralelas antigas foram substituídas pelo endpoint agregado no backend.
// =============================================================================
"use client";

import { useState } from "react";
import { FolderOpen, X } from "lucide-react";

import { useDashboardSummary, type PeriodoDias } from "@/hooks/useDashboardSummary";
import { useProjects } from "@/hooks/useProjects";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { KpiCards } from "./KpiCards";
import { ProjectsHealthTable } from "./ProjectsHealthTable";
import { TopFailuresCard } from "./TopFailuresCard";
import { TopFlakyCard } from "./TopFlakyCard";
import { WorkloadCard } from "./WorkloadCard";
import { TrendChartCard } from "./TrendChartCard";

export function DashboardClient() {
  // "" = todos os projetos (sem filtro na API)
  const [projectId, setProjectId] = useState<string>("");
  const [days, setDays] = useState<PeriodoDias>(7);

  const { data, loading, error, refetch } = useDashboardSummary(projectId || undefined, days);
  const { projects, loading: projectsLoading } = useProjects();

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div className="space-y-5">
      {/* ── Filtro global por projeto ────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 px-4 py-3 flex-wrap"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      >
        <FolderOpen size={16} className="text-blue-500 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-600 dark:text-slate-300 flex-shrink-0">Projeto:</span>

        <Select
          value={projectId || "__all__"}
          onValueChange={(v) => setProjectId(v === "__all__" ? "" : v)}
          disabled={projectsLoading}
        >
          <SelectTrigger className="w-auto min-w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos os projetos</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {projectId && (
          <button
            onClick={() => setProjectId("")}
            className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Limpar filtro de projeto"
          >
            <X size={13} />
            Limpar
          </button>
        )}

        {selectedProject && (
          <span className="ml-auto text-xs text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-full font-medium border border-blue-100 dark:border-blue-800">
            Filtrando: {selectedProject.name}
          </span>
        )}
      </div>

      {/* ── Estados de UI: loading / erro / sucesso ──────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">
            {selectedProject
              ? `Carregando métricas de "${selectedProject.name}"...`
              : "Carregando métricas..."}
          </p>
        </div>
      )}

      {!loading && (error || !data) && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-8 text-center">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
            Não foi possível carregar as métricas
          </p>
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">
            {error ?? "Verifique se o servidor está acessível."}
          </p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Faixa 1 — KPIs */}
          <KpiCards kpis={data.kpis} />

          {/* Faixa 2 — só em "Todos os projetos" (1 projeto = tabela de 1 linha) */}
          {!projectId && <ProjectsHealthTable projects={data.projects_health} />}

          {/* Faixa 3 — análise em 3 colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TopFailuresCard failures={data.top_failures} />
            <TopFlakyCard flaky={data.top_flaky} />
            <WorkloadCard workload={data.workload_by_assignee} />
          </div>

          {/* Faixa 4 — tendência com período controlado */}
          <TrendChartCard data={data.trend} days={days} onDaysChange={setDays} />
        </>
      )}
    </div>
  );
}
