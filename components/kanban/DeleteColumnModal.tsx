"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import type { KanbanBoardColumn } from "@/lib/types/kanban";

interface Props {
  open: boolean;
  column: KanbanBoardColumn;
  otherColumns: KanbanBoardColumn[];
  onClose: () => void;
  onConfirm: (targetColumnId: string) => Promise<void>;
}

export function DeleteColumnModal({ open, column, otherColumns, onClose, onConfirm }: Props) {
  const [targetId, setTargetId] = useState(otherColumns[0]?.id ?? "");
  const [saving,   setSaving]   = useState(false);

  const handleConfirm = async () => {
    if (!targetId) return;
    setSaving(true);
    try {
      await onConfirm(targetId);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Remover coluna</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">
              A coluna <span className="font-semibold">"{column.name}"</span> possui{" "}
              <span className="font-semibold">{column.cases_count} caso{column.cases_count !== 1 ? "s" : ""}</span>.
              Escolha para onde movê-los antes de remover.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Mover casos para
            </label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger placeholder="Selecione uma coluna" className="w-full" />
              <SelectContent>
                {otherColumns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.name} ({col.cases_count} casos)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!targetId || saving}
            className="rounded-md bg-destructive px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Removendo…" : "Mover e remover"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}