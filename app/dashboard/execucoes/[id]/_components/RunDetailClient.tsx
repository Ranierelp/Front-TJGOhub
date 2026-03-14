// =============================================================================
// Orquestrador da pagina de detalhe de uma execucao
//
// Fluxo: hook useRunDetail busca os dados → componentes so renderizam.
// Tres estados da run: loading, error/nao-encontrada, dados.
// =============================================================================

"use client";

import { Loader2 } from "lucide-react";
import { GlassBackground } from "../../../projetos/_components/GlassBackground";
import { RunDetailHeader } from "./RunDetailHeader";
import { RunProgressBar } from "./RunProgressBar";
import { RunMetricsBar } from "./RunMetricsBar";
import { ResultsList } from "./ResultsList";
import { useRunDetail } from "@/hooks/useRunDetail";

interface RunDetailClientProps {
  runId: string;
}

export function RunDetailClient({ runId }: RunDetailClientProps) {
  const {
    run,
    results,
    isLoadingRun,
    isLoadingResults,
    error,
    statusFilter,
    setStatusFilter,
    resultsPagination,
    setResultsPage,
    refetch,
  } = useRunDetail(runId);

  // Estado 1: carregando cabecalho da run
  if (isLoadingRun) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#3B82F6" }} />
      </div>
    );
  }

  // Estado 2: erro ou run nao encontrada
  if (error || !run) {
    return (
      <div className="flex flex-col items-center py-20 gap-2">
        <span className="text-3xl" aria-hidden="true">⚠️</span>
        <p className="text-sm" style={{ color: "#dc2626" }}>
          {error ?? "Execucao nao encontrada"}
        </p>
      </div>
    );
  }

  // Estado 3: dados disponiveis
  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <GlassBackground />

      <div className="flex flex-col gap-5">
        {/* Cabecalho: botao voltar + card com info */}
        <RunDetailHeader run={run} />

        {/* Barra proporcional colorida (passed/failed/flaky/skipped) */}
        <RunProgressBar run={run} />

        {/* Pills clicaveis de metricas — clicando filtra os resultados */}
        <RunMetricsBar
          run={run}
          activeFilter={statusFilter}
          onFilter={setStatusFilter}
        />

        {/* Lista de resultados (com estados loading/vazio/dados proprios) */}
        <ResultsList
          results={results}
          isLoading={isLoadingResults}
          pagination={resultsPagination}
          onPageChange={setResultsPage}
          onMarkedFlaky={refetch}
        />
      </div>
    </div>
  );
}
