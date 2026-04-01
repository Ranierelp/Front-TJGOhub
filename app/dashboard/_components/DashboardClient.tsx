// =============================================================================
// CONCEITO 4: A fronteira Server → Client Component
//
// page.tsx (Server Component) não pode usar hooks nem estado.
// Para termos dados dinâmicos (fetch + loading + error), precisamos de
// um Client Component. Esse arquivo é essa fronteira.
//
// Fluxo:
//   page.tsx (Server)          → renderiza o shell estático (título, layout)
//   DashboardClient (Client)   → busca dados, gerencia loading/error, renderiza cards
//
// CONCEITO 5: Estados de UI — Loading, Error, Success
//
// Toda tela que busca dados assíncronos tem 3 estados possíveis:
//   loading: true     → mostra spinner (dados ainda vindo)
//   error: "msg"      → mostra mensagem de erro + botão de retry
//   data: {...}       → mostra o conteúdo real
//
// CONCEITO 6: Lifting State Up — estado que afeta múltiplos filhos
//
// O projeto selecionado precisa ser passado para useDashboardData E
// exibido no seletor. O estado deve ficar no componente pai comum:
// aqui, o próprio DashboardClient.
//
//   DashboardClient (tem: projectId, setProjectId)
//     ├── ProjectSelector  ← lê e modifica projectId
//     └── Cards (via useDashboardData(projectId)) ← lê projectId
//
// Paralelo Django: é como um filtro na view que é passado para o queryset
// E para o template (para marcar o item selecionado no <select>).
// =============================================================================
"use client";

import { useState } from "react";
import { FolderOpen, X } from "lucide-react";

import { useDashboardData } from "@/hooks/useDashboardData";
import { useProjects }      from "@/hooks/useProjects";
import { Spinner }          from "@/components/ui/spinner";
import { LastRunCard }      from "./LastRunCard";
import { PassRateCard }     from "./PassRateCard";
import { TopFailuresCard }  from "./TopFailuresCard";
import { TopFlakyCard }     from "./TopFlakyCard";
import { TrendChartCard }   from "./TrendChartCard";

export function DashboardClient() {
  // =========================================================================
  // CONCEITO 6 aplicado: estado do projeto selecionado
  //
  // "" significa "Todos os projetos" (sem filtro).
  // Quando o usuário troca, setProjectId atualiza o estado →
  // React re-renderiza → useDashboardData recebe o novo projectId →
  // useEffect detecta a mudança → nova requisição à API.
  // =========================================================================
  const [projectId, setProjectId] = useState<string>("");

  // Passa undefined quando nenhum projeto selecionado (sem filtro na API)
  const { data, loading, error, refetch } = useDashboardData(projectId || undefined);
  const { projects, loading: projectsLoading } = useProjects();

  // Encontra o nome do projeto selecionado para exibição contextual
  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div className="space-y-5">

      {/* ── BARRA DE FILTRO POR PROJETO ─────────────────────────────────── */}
      <div
        className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 px-4 py-3 flex-wrap"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      >
        <FolderOpen size={16} className="text-blue-500 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-600 dark:text-slate-300 flex-shrink-0">Projeto:</span>

        {/*
          Select de projetos — controlado pelo estado projectId.
          "Controlado" = React gerencia o valor (value + onChange).
          O oposto seria "não controlado" (deixar o DOM gerenciar).

          Paralelo Django: <select name="projeto"> com selected dinâmico.
        */}
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={projectsLoading}
          className="text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-gray-700 dark:text-slate-200
                     bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                     disabled:opacity-50 min-w-48"
        >
          <option value="">Todos os projetos</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Botão "Limpar filtro" — aparece somente quando há projeto selecionado */}
        {projectId && (
          <button
            onClick={() => setProjectId("")}
            className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500
                       hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Limpar filtro de projeto"
          >
            <X size={13} />
            Limpar
          </button>
        )}

        {/* Badge indicando o projeto ativo — feedback visual do filtro atual */}
        {selectedProject && (
          <span className="ml-auto text-xs text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2.5 py-1
                           rounded-full font-medium border border-blue-100 dark:border-blue-800">
            Filtrando: {selectedProject.name}
          </span>
        )}
      </div>

      {/* ── ESTADOS DE UI ────────────────────────────────────────────────── */}

      {/* Estado: Carregando */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-400">
            {selectedProject
              ? `Carregando dados de "${selectedProject.name}"...`
              : "Carregando dados..."}
          </p>
        </div>
      )}

      {/* Estado: Erro */}
      {!loading && (error || !data) && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-8 text-center">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
            Não foi possível carregar os dados
          </p>
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">
            {error ?? "Verifique se o servidor está acessível."}
          </p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700
                       rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Estado: Sucesso — cards com dados reais */}
      {!loading && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {data.lastRun && <LastRunCard run={data.lastRun} />}
            <PassRateCard
              passed={data.passRate.passed}
              failed={data.passRate.failed}
              skipped={data.passRate.skipped}
            />
            <TopFailuresCard failures={data.failures} />
            <TopFlakyCard    flaky={data.flaky} />
          </div>

          <TrendChartCard data={data.trend} />
        </>
      )}
    </div>
  );
}
