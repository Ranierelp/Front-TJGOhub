// =============================================================================
// Orquestrador da tela de listagem de execucoes
//
// Este componente nao tem logica propria — apenas conecta o hook useRuns
// com os componentes visuais. O padrao "thin component, fat hook" garante
// que a logica e testavel separadamente da UI.
// =============================================================================

"use client";

import { GlassBackground } from "../../projetos/_components/GlassBackground";
import { RunsHeader } from "./RunsHeader";
import { RunsStatsCards } from "./RunsStatsCards";
import { RunsFilters } from "./RunsFilters";
import { RunsTable } from "./RunsTable";
import { useRuns } from "@/hooks/useRuns";

export function RunsClient() {
  const {
    runs,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    pagination,
    setPage,
  } = useRuns();

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <GlassBackground />

      <div className="flex flex-col gap-5">
        <RunsHeader total={pagination.total} />

        <RunsStatsCards runs={runs} total={pagination.total} />

        <RunsFilters
          search={search}
          onSearch={setSearch}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
        />

        {error ? (
          <div className="flex flex-col items-center py-10 gap-2">
            <span className="text-2xl" aria-hidden="true">⚠️</span>
            <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>
          </div>
        ) : (
          <RunsTable runs={runs} isLoading={isLoading} />
        )}

        {/* Paginacao — aparece so quando ha mais de uma pagina */}
        {!isLoading && !error && pagination.total > 20 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs" style={{ color: "var(--col-dim)" }}>
              Pagina {pagination.page} de {pagination.totalPages} · {pagination.total} execucoes
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPage(pagination.page - 1)}
                className="px-4 py-1.5 rounded-xl text-xs font-medium"
                style={{
                  background: "var(--glass-card-bg)",
                  border: "1px solid var(--glass-inner-border)",
                  color: pagination.page === 1 ? "var(--col-dim)" : "var(--col-muted)",
                  cursor: pagination.page === 1 ? "not-allowed" : "pointer",
                }}
              >
                ← Anterior
              </button>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPage(pagination.page + 1)}
                className="px-4 py-1.5 rounded-xl text-xs font-medium"
                style={{
                  background: "var(--glass-card-bg)",
                  border: "1px solid var(--glass-inner-border)",
                  color:
                    pagination.page === pagination.totalPages
                      ? "var(--col-dim)"
                      : "var(--col-muted)",
                  cursor:
                    pagination.page === pagination.totalPages
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Proxima →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
