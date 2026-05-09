"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { KanbanCard } from "./KanbanCard";
import type { KanbanBoardColumn } from "@/lib/types/kanban";

interface Props {
  column: KanbanBoardColumn;
}

export function KanbanColumn({ column }: Props) {
  const router = useRouter();

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted p-3">

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
        <button
          type="button"
          onClick={() => router.push("/dashboard/casos/novo")}
          className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={`Adicionar caso em ${column.name}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
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
