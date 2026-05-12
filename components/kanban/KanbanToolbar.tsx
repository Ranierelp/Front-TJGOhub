"use client";

import { Search, Filter, X } from "lucide-react";
import type { Project } from "@/hooks/useProjects";
import { Select } from "@/components/ui/select";

export type PriorityFilter = "all" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

const PRIORITY_LABELS: Record<PriorityFilter, string> = {
  all:      "Todas",
  CRITICAL: "Crítica",
  HIGH:     "Alta",
  MEDIUM:   "Média",
  LOW:      "Baixa",
};
const PRIORITY_OPTIONS: PriorityFilter[] = ["all", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

export interface Assignee { id: string; name: string; initials: string; }

interface Props {
  projects:         Project[];
  projectCounts:    Record<string, number>;
  activeProjectId:  string;
  onProjectChange:  (id: string) => void;
  search:           string;
  onSearchChange:   (v: string) => void;
  filterPriority:   PriorityFilter;
  onPriorityChange: (v: PriorityFilter) => void;
  filterAssignee:   string;
  onAssigneeChange: (v: string) => void;
  assignees:        Assignee[];
}

export function KanbanToolbar({
  projects, projectCounts,
  activeProjectId, onProjectChange,
  search, onSearchChange,
  filterPriority, onPriorityChange,
  filterAssignee, onAssigneeChange,
  assignees,
}: Props) {

  const cycleAssignee = () => {
    const order = ["all", ...assignees.map(a => a.id)];
    const idx   = order.indexOf(filterAssignee);
    onAssigneeChange(order[(idx + 1) % order.length]);
  };

  const assigneeLabel =
    filterAssignee === "all"
      ? "Todos"
      : (assignees.find(a => a.id === filterAssignee)?.name.split(" ")[0] ?? "?");

  const allCount = Object.values(projectCounts).reduce((s, n) => s + n, 0);

  // Chip de filtro (prioridade / responsável)
  const chipCls = (active: boolean) =>
    `inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-[7px] text-xs font-semibold transition-colors ${
      active
        ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-400"
        : "border-border bg-card text-muted-foreground hover:bg-muted"
    }`;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5">

      {/* Project select */}
      <Select
        value={activeProjectId}
        onChange={e => onProjectChange(e.target.value)}
        containerClassName="w-auto"
        className="h-auto py-[7px] text-xs font-semibold"
      >
        <option value="">Todos{allCount > 0 ? ` (${allCount})` : ""}</option>
        {projects.map(p => {
          const count = projectCounts[p.id] ?? 0;
          return (
            <option key={p.id} value={p.id}>
              {p.name}{count > 0 ? ` (${count})` : ""}
            </option>
          );
        })}
      </Select>

      {/* Search */}
      <div className="flex min-w-[200px] max-w-sm flex-1 items-center gap-2 rounded-lg border border-border bg-muted px-2.5 py-1.5">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Buscar por título, ID ou tag…"
          className="flex-1 border-0 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {search && (
          <button type="button" onClick={() => onSearchChange("")} className="text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Chips */}
      <Select
        value={filterPriority}
        onChange={e => onPriorityChange(e.target.value as PriorityFilter)}
        containerClassName="w-auto"
        className="h-auto py-[7px] text-xs font-semibold"
      >
        {PRIORITY_OPTIONS.map(p => (
          <option key={p} value={p}>{p === "all" ? "Prioridade: Todas" : `Prioridade: ${PRIORITY_LABELS[p]}`}</option>
        ))}
      </Select>

      <button type="button" onClick={cycleAssignee} className={chipCls(filterAssignee !== "all")}>
        <span className="font-medium opacity-70">Responsável:</span>
        {assigneeLabel}
      </button>

      <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-[7px] text-xs font-semibold text-muted-foreground hover:bg-muted">
        <Filter className="h-3.5 w-3.5" />
        Filtros
      </button>
    </div>
  );
}
