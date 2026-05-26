"use client";

// =============================================================================
// NameAndColorModal — modal genérico de "criar nome + cor".
//
// Compartilhado por:
//   - Kanban → criar nova coluna
//   - TagSelector → criar nova tag
//
// Usa tokens do shadcn (bg-background, text-muted-foreground, etc.) pra
// respeitar o tema claro/escuro automaticamente.
// =============================================================================

import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Recebe (nome, cor) e cria o recurso. Lança erro pra manter o modal aberto. */
  onSubmit: (name: string, color: string) => Promise<void>;

  title:        string;   // ex.: "Nova coluna" / "Nova tag"
  nameLabel:    string;   // ex.: "Nome"
  colorLabel:   string;   // ex.: "Cor da coluna" / "Escolha uma cor"
  placeholder:  string;   // ex.: "Ex: Cancelado, Em revisão…"
  submitLabel:  string;   // ex.: "Criar coluna" / "Criar tag"
  colors:       string[]; // paleta de cores
  defaultColor: string;   // cor inicial selecionada
}

export function NameAndColorModal({
  open, onClose, onSubmit,
  title, nameLabel, colorLabel, placeholder, submitLabel,
  colors, defaultColor,
}: Props) {
  const [name,   setName]   = useState("");
  const [color,  setColor]  = useState(defaultColor);
  const [saving, setSaving] = useState(false);

  // Reseta o estado sempre que o modal abre — evita persistir valores antigos
  useEffect(() => {
    if (open) {
      setName("");
      setColor(defaultColor);
    }
  }, [open, defaultColor]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit(name.trim(), color);
      onClose();
    } catch {
      // O caller já mostrou toast; mantém modal aberto pra correção.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {nameLabel}
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={placeholder}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {colorLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background:    c,
                    borderColor:   color === c ? "hsl(var(--foreground))" : "transparent",
                    outline:       color === c ? "2px solid hsl(var(--background))" : "none",
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
            {saving ? "Criando…" : submitLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
