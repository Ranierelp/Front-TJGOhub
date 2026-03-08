// Lista de resultados com paginacao inline.
// Separa o estado de loading/vazio do conteudo — mesmo padrao de RunsTable.

import { Loader2 } from "lucide-react";
import ResultCard from "./ResultCard";
import type { TestResult } from "@/lib/api/runs";

interface ResultsListProps {
  results: TestResult[];
  isLoading: boolean;
  pagination: { page: number; totalPages: number; total: number };
  onPageChange: (page: number) => void;
}

export function ResultsList({
  results,
  isLoading,
  pagination,
  onPageChange,
}: ResultsListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#3B82F6" }} />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 gap-2">
        <span className="text-3xl" aria-hidden="true">🔍</span>
        <p className="text-sm" style={{ color: "var(--col-muted)" }}>
          Nenhum resultado encontrado para este filtro
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {results.map((r) => (
        <ResultCard key={r.id} result={r} />
      ))}

      {/* Paginacao — so aparece quando ha mais de uma pagina */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 px-1">
          <span className="text-xs" style={{ color: "var(--col-dim)" }}>
            Pagina {pagination.page} de {pagination.totalPages} · {pagination.total} resultados
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => onPageChange(pagination.page - 1)}
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
              onClick={() => onPageChange(pagination.page + 1)}
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
  );
}
