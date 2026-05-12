"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const PRESET_COLORS = [
  "#6366f1", "#3b82f6", "#22c55e", "#ef4444",
  "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f97316", "#6b7280",
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, color: string) => Promise<void>;
}

export function AddColumnModal({ open, onClose, onSubmit }: Props) {
  const [name,   setName]   = useState("");
  const [color,  setColor]  = useState("#6366f1");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit(name.trim(), color);
      setName("");
      setColor("#6366f1");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova coluna</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nome
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Ex: Cancelado, Em revisão…"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cor da coluna
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: c,
                    borderColor: color === c ? "hsl(var(--foreground))" : "transparent",
                    outline: color === c ? "2px solid hsl(var(--background))" : "none",
                    outlineOffset: color === c ? "-4px" : "0",
                  }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full" style={{ background: color }} />
              <span className="font-mono text-xs text-muted-foreground">{color}</span>
            </div>
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
            onClick={handleSubmit}
            disabled={!name.trim() || saving}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Criando…" : "Criar coluna"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}