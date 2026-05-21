"use client";

import { useRef }      from "react";
import { useRouter }   from "next/navigation";
import { Draggable }   from "@hello-pangea/dnd";
import type { KanbanCard as KanbanCardType } from "@/lib/types/kanban";

// Distância mínima (px) entre mousedown e mouseup para considerar que houve drag.
// Movimentos abaixo desse limite são tratados como clique e navegam para o caso.
const DRAG_THRESHOLD_PX = 5;

// Cor da barra lateral de prioridade (funciona em ambos os temas)
const PRIORITY_BAR: Record<string, string> = {
  CRITICAL: "#dc2626",
  HIGH:     "#ea580c",
  MEDIUM:   "#2563eb",
  LOW:      "#94a3b8",
};

// Classes Tailwind por status — inclui variantes dark:
const STATUS_CONFIG: Record<string, { wrapper: string; dot: string }> = {
  DRAFT: {
    wrapper: "bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400",
    dot:     "bg-slate-400",
  },
  ACTIVE: {
    wrapper: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400",
    dot:     "bg-emerald-500 dark:bg-emerald-400",
  },
  DEPRECATED: {
    wrapper: "bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-400",
    dot:     "bg-amber-500 dark:bg-amber-400",
  },
};

// Cor do avatar gerada deterministicamente a partir do ID
function avatarColor(seed: string): string {
  const P = ["#1e3a8a","#0f766e","#9a3412","#6d28d9","#be185d","#0369a1","#065f46","#92400e"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return P[h % P.length];
}

interface Props {
  card:  KanbanCardType;
  index: number;
}

export function KanbanCard({ card, index }: Props) {
  const router = useRouter();
  const bar    = PRIORITY_BAR[card.priority] ?? "#94a3b8";
  const status = STATUS_CONFIG[card.status]  ?? STATUS_CONFIG.DRAFT;

  // Detecção clique vs drag — @hello-pangea/dnd dispara onClick mesmo após drag.
  // Guardamos a posição inicial do mousedown e marcamos `wasDragged` se passar do limiar.
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const wasDragged   = useRef(false);

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseDown={e => {
            mouseDownPos.current = { x: e.clientX, y: e.clientY };
            wasDragged.current   = false;
          }}
          onMouseMove={e => {
            if (!mouseDownPos.current) return;
            const dx = Math.abs(e.clientX - mouseDownPos.current.x);
            const dy = Math.abs(e.clientY - mouseDownPos.current.y);
            if (dx > DRAG_THRESHOLD_PX || dy > DRAG_THRESHOLD_PX) wasDragged.current = true;
          }}
          onClick={() => {
            // Não navega durante o drag — o snapshot.isDragging continua true até o drop.
            if (!wasDragged.current && !snapshot.isDragging) {
              router.push(`/dashboard/casos/${card.id}`);
            }
          }}
          className={[
            "relative overflow-hidden rounded-[10px] border border-border bg-card pl-[14px] pr-3.5 py-3",
            "select-none transition-all duration-150",
            // cursor: grab durante drag, pointer (link) quando parado
            snapshot.isDragging ? "cursor-grabbing" : "cursor-pointer",
            snapshot.isDragging
              ? "shadow-[0_4px_16px_rgba(15,23,42,0.18)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5)] rotate-[1deg]"
              : "shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
          ].join(" ")}
        >
          {/* Barra de prioridade */}
          <div
            className="absolute inset-y-0 left-0 w-[3px]"
            style={{ background: bar }}
            aria-hidden
          />

          {/* Linha 1: case_id + status */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
              {card.case_id}
            </span>
            <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-[2px] text-[10.5px] font-semibold ${status.wrapper}`}>
              <span className={`h-[5px] w-[5px] shrink-0 rounded-full ${status.dot}`} />
              {card.status_display}
            </span>
          </div>

          {/* Título */}
          <p className="mb-2.5 text-[13.5px] font-semibold leading-snug text-blue-600 dark:text-blue-400 [text-wrap:pretty]">
            {card.title}
          </p>

          {/* Tags */}
          {card.tags.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-1">
              {card.tags.map(tag => (
                <span
                  key={tag.id}
                  className="inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Footer: avatar + nome | prioridade */}
          <div className="flex items-center justify-between gap-2">
            {card.assigned_to_id ? (
              <div className="flex min-w-0 items-center gap-1.5">
                <div
                  className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
                  style={{ width: 22, height: 22, fontSize: 9, background: avatarColor(card.assigned_to_id) }}
                  title={card.assigned_to_name ?? undefined}
                >
                  {card.assigned_to_initials}
                </div>
                <span className="truncate text-[11.5px] font-medium text-muted-foreground">
                  {card.assigned_to_name?.split(" ").slice(0, 2).join(" ")}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground/50">Sem responsável</span>
            )}

            <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10.5px] font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: bar }} />
              {card.priority_display}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
