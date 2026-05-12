"use client";

import { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Trash2 } from "lucide-react";

import { KanbanCard } from "./KanbanCard";
import type { KanbanBoardColumn } from "@/lib/types/kanban";

interface Props {
  column: KanbanBoardColumn;
  onDelete?: () => void;
}

export function KanbanColumn({ column, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="group flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted p-3">

      {/* Cabeçalho */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: column.color }}
          />
          <span className="text-[12.5px] font-bold uppercase tracking-wide text-foreground">
            {column.name}
          </span>
          <span className="rounded-full border border-border bg-card px-[7px] py-[1px] text-[11px] font-semibold text-muted-foreground">
            {column.cases_count}
          </span>
        </div>

        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-destructive">Remover?</span>
            <button
              type="button"
              onClick={() => { onDelete?.(); setConfirmDelete(false); }}
              className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white bg-destructive hover:bg-destructive/90 transition-colors"
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded border border-border px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground transition-colors hover:bg-accent"
            >
              Não
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Remover coluna ${column.name}`}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Área de drop */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={[
              "flex min-h-[120px] flex-col gap-2 rounded-xl p-1.5 transition-colors",
              snapshot.isDraggingOver ? "bg-accent" : "",
            ].join(" ")}
          >
            {column.cases.map((card, index) => (
              <KanbanCard key={card.id} card={card} index={index} />
            ))}

            {column.cases.length === 0 && !snapshot.isDraggingOver && (
              <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[11.5px] text-muted-foreground">
                Arraste casos aqui
              </div>
            )}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
