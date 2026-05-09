// =============================================================================
// Hook do board Kanban
//
// Responsabilidades:
//   1. Buscar o board completo (colunas + cards) da API
//   2. Expor onDragEnd: atualiza o estado local imediatamente (otimista)
//      e depois confirma na API — se falhar, reverte para o estado anterior
//   3. Filtrar por projeto via ?project=<uuid>
//
// "Atualização otimista": muda a tela antes da API responder.
// Se a API falhar, desfaz a mudança. Isso deixa a UI mais fluida.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { DropResult } from "@hello-pangea/dnd";

import { get, post, api } from "@/lib/api";
import type { KanbanBoardColumn } from "@/lib/types/kanban";

export function useKanban(projectId?: string) {
  const [columns, setColumns] = useState<KanbanBoardColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Busca o board completo na API
  const fetchBoard = useCallback(() => {
    setLoading(true);
    const params = projectId ? { project: projectId } : {};

    get<KanbanBoardColumn[]>(api.endpoints.kanbanBoard, { params })
      .then((r) => { setColumns(r.data); setError(null); })
      .catch(() => setError("Falha ao carregar o board."))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  // Chamado pelo @hello-pangea/dnd quando o usuário solta um card
  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Ignorar se soltar fora de uma coluna válida ou na mesma posição
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    // Guarda o estado atual para poder reverter em caso de erro
    const snapshot = columns;

    // Atualização otimista: reorganiza os cards localmente sem esperar a API
    setColumns((prev) => {
      const next = prev.map((col) => ({ ...col, cases: [...col.cases] }));

      const srcCol  = next.find((c) => c.id === source.droppableId);
      const dstCol  = next.find((c) => c.id === destination.droppableId);
      if (!srcCol || !dstCol) return prev;

      // Remove o card da posição de origem
      const [moved] = srcCol.cases.splice(source.index, 1);

      // Insere o card na posição de destino
      dstCol.cases.splice(destination.index, 0, moved);

      return next;
    });

    // Confirma na API (em background)
    post(api.endpoints.moveCase(draggableId), {
      column_id: destination.droppableId,
      position:  destination.index,
    }).catch(() => {
      // Reverter para o estado antes do drag se a API falhar
      setColumns(snapshot);
      setError("Falha ao mover card. A operação foi revertida.");
    });
  }, [columns]);

  return { columns, loading, error, refetch: fetchBoard, onDragEnd };
}
