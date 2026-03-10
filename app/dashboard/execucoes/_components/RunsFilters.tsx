// Barra de filtros: campo de busca + botoes de status

import { Search } from "lucide-react";
import { GlassCard } from "../../projetos/_components/GlassBackground";
import type { RunStatusFilter } from "@/hooks/useRuns";

interface RunsFiltersProps {
  search: string;
  onSearch: (value: string) => void;
  statusFilter: RunStatusFilter;
  onStatusFilter: (value: RunStatusFilter) => void;
}

const STATUS_OPTIONS: { value: RunStatusFilter; label: string }[] = [
  { value: "all",       label: "Todos"     },
  { value: "RUNNING",   label: "Rodando"   },
  { value: "COMPLETED", label: "Concluido" },
  { value: "FAILED",    label: "Falhou"    },
  { value: "CANCELLED", label: "Cancelado" },
];

export function RunsFilters({
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
}: RunsFiltersProps) {
  return (
    <GlassCard className="p-4">
      <div className="flex flex-wrap gap-3">
        {/* Campo de busca */}
        <div className="relative flex-1 min-w-52">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "var(--col-dim)" }}
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar por ID, projeto ou branch..."
            className="glass-input w-full pl-9 pr-3.5 py-2 rounded-xl text-sm"
            aria-label="Buscar execucoes"
          />
        </div>

        {/* Botoes de filtro por status */}
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--glass-inner-border)" }}
          role="group"
          aria-label="Filtrar por status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onStatusFilter(opt.value)}
              className="px-4 py-2 text-sm font-medium transition-all"
              aria-pressed={statusFilter === opt.value}
              style={{
                background:
                  statusFilter === opt.value
                    ? "linear-gradient(135deg,#2563EB,#3B82F6)"
                    : "transparent",
                color:
                  statusFilter === opt.value ? "white" : "var(--col-muted)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
