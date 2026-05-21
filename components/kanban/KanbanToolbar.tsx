"use client";

import { Search, Filter, X } from "lucide-react";
import type { Project } from "@/hooks/useProjects";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

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

  const allCount = Object.values(projectCounts).reduce((s, n) => s + n, 0);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5">

      {/* Project select */}
      <Select value={activeProjectId || "__all__"} onValueChange={v => onProjectChange(v === "__all__" ? "" : v)}>
        <SelectTrigger className="w-auto h-auto py-[7px] text-xs font-semibold gap-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todos{allCount > 0 ? ` (${allCount})` : ""}</SelectItem>
          {projects.map(p => {
            const count = projectCounts[p.id] ?? 0;
            return (
              <SelectItem key={p.id} value={p.id}>
                {p.name}{count > 0 ? ` (${count})` : ""}
              </SelectItem>
            );
          })}
        </SelectContent>
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
      <Select value={filterPriority} onValueChange={v => onPriorityChange(v as PriorityFilter)}>
        <SelectTrigger className="w-auto h-auto py-[7px] text-xs font-semibold gap-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRIORITY_OPTIONS.map(p => (
            <SelectItem key={p} value={p}>{p === "all" ? "Prioridade: Todas" : `Prioridade: ${PRIORITY_LABELS[p]}`}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Responsável */}
      <Select value={filterAssignee} onValueChange={onAssigneeChange}>
        <SelectTrigger className="w-auto h-auto py-[7px] text-xs font-semibold gap-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Responsável: Todos</SelectItem>
          {assignees.map(a => (
            <SelectItem key={a.id} value={a.id}>Responsável: {a.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-[7px] text-xs font-semibold text-muted-foreground hover:bg-muted">
        <Filter className="h-3.5 w-3.5" />
        Filtros
      </button>
    </div>
  );
}
