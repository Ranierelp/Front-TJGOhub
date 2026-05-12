"use client";

import { useMemo, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";

import { useKanban }   from "@/hooks/useKanban";
import { useProjects } from "@/hooks/useProjects";
import { KanbanColumn }      from "./KanbanColumn";
import { AddColumnModal }    from "./AddColumnModal";
import { DeleteColumnModal } from "./DeleteColumnModal";
import { KanbanToolbar, type PriorityFilter, type Assignee } from "./KanbanToolbar";
import { Spinner } from "@/components/ui/spinner";
import type { KanbanBoardColumn } from "@/lib/types/kanban";

export function KanbanBoard() {
  const [activeProjectId, setActiveProjectId] = useState("");
  const [search,          setSearch]          = useState("");
  const [filterPriority,  setFilterPriority]  = useState<PriorityFilter>("all");
  const [filterAssignee,  setFilterAssignee]  = useState("all");
  const [addColumnOpen,    setAddColumnOpen]    = useState(false);
  const [deletingColumn,   setDeletingColumn]   = useState<KanbanBoardColumn | null>(null);

  const { columns, loading, error, onDragEnd, createColumn, deleteColumn } = useKanban(activeProjectId || undefined);
  const { projects } = useProjects();

  // Contagem de casos por projeto a partir dos dados do board
  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    columns.forEach(col => col.cases.forEach(c => {
      counts[c.project] = (counts[c.project] ?? 0) + 1;
    }));
    return counts;
  }, [columns]);

  // Lista de responsáveis únicos no board atual
  const assignees = useMemo<Assignee[]>(() => {
    const seen = new Map<string, Assignee>();
    columns.forEach(col => col.cases.forEach(c => {
      if (c.assigned_to_id && !seen.has(c.assigned_to_id)) {
        seen.set(c.assigned_to_id, {
          id:       c.assigned_to_id,
          name:     c.assigned_to_name     ?? "",
          initials: c.assigned_to_initials ?? "",
        });
      }
    }));
    return Array.from(seen.values());
  }, [columns]);

  // Filtragem client-side: busca + prioridade + responsável
  const filteredColumns = useMemo<KanbanBoardColumn[]>(() => {
    const q = search.trim().toLowerCase();
    return columns.map(col => {
      const cases = col.cases.filter(c => {
        if (q) {
          const hay = `${c.case_id} ${c.title} ${c.tags.map(t => t.name).join(" ")}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (filterPriority !== "all" && c.priority !== filterPriority) return false;
        if (filterAssignee !== "all" && c.assigned_to_id !== filterAssignee) return false;
        return true;
      });
      return { ...col, cases, cases_count: cases.length };
    });
  }, [columns, search, filterPriority, filterAssignee]);

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  );
  if (error) return (
    <div className="flex items-center justify-center h-64 text-destructive text-sm">{error}</div>
  );

  return (
    <div>
      <KanbanToolbar
        projects={projects}
        projectCounts={projectCounts}
        activeProjectId={activeProjectId}
        onProjectChange={setActiveProjectId}
        search={search}
        onSearchChange={setSearch}
        filterPriority={filterPriority}
        onPriorityChange={setFilterPriority}
        filterAssignee={filterAssignee}
        onAssigneeChange={setFilterAssignee}
        assignees={assignees}
      />
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3.5 overflow-x-auto pb-4 items-start">
          {filteredColumns.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              onDelete={() => {
                if (column.cases_count === 0) {
                  deleteColumn(column.id);
                } else {
                  setDeletingColumn(column);
                }
              }}
            />
          ))}
          {filteredColumns.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma coluna encontrada.</p>
          )}

          {/* Botão para adicionar nova coluna */}
          <button
            type="button"
            onClick={() => setAddColumnOpen(true)}
            className="flex w-72 shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed border-border py-5 text-muted-foreground transition-colors hover:border-ring hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Nova coluna</span>
          </button>
        </div>
      </DragDropContext>

      <AddColumnModal
        open={addColumnOpen}
        onClose={() => setAddColumnOpen(false)}
        onSubmit={createColumn}
      />

      {deletingColumn && (
        <DeleteColumnModal
          open={true}
          column={deletingColumn}
          otherColumns={columns.filter(c => c.id !== deletingColumn.id)}
          onClose={() => setDeletingColumn(null)}
          onConfirm={(targetId) => deleteColumn(deletingColumn.id, targetId)}
        />
      )}
    </div>
  );
}
