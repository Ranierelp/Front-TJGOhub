"use client";

// =============================================================================
// Zona de upload de imagens para o passo a passo do caso de teste.
//
// Funcionamento:
//   - Clique na área ou arraste imagens para adicionar
//   - Cada imagem adicionada mostra um preview + campos title/description
//   - O componente mantém a lista local; o pai recebe via onChangeCallback
//   - Os arquivos NÃO são enviados ao servidor aqui — ficam pendentes até
//     o formulário ser submetido (o hook useCreateCase faz o upload depois)
// =============================================================================

import { useRef, useCallback } from "react";
import { X } from "lucide-react";

import type { PendingAttachment } from "@/hooks/useCreateCase";

interface Props {
  attachments: PendingAttachment[];
  onChange:    (next: PendingAttachment[]) => void;
}

export function AttachmentUploadZone({ attachments, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Adiciona novos arquivos à lista, criando URL de preview local
  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const next: PendingAttachment[] = [...attachments];
    Array.from(files).forEach((file) => {
      next.push({
        file,
        preview:     URL.createObjectURL(file),
        title:       file.name.replace(/\.[^.]+$/, ""), // nome sem extensão
        description: "",
      });
    });
    onChange(next);
  }, [attachments, onChange]);

  const remove = (index: number) => {
    const next = attachments.filter((_, i) => i !== index);
    URL.revokeObjectURL(attachments[index].preview); // libera memória
    onChange(next);
  };

  const updateField = (index: number, field: "title" | "description", value: string) => {
    const next = attachments.map((a, i) => i === index ? { ...a, [field]: value } : a);
    onChange(next);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* Zona de drop */}
      <div
        className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <p className="text-sm text-muted-foreground">
          Arraste imagens aqui ou <span className="text-primary underline">clique para selecionar</span>
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, GIF — qualquer tamanho</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Grid de previews */}
      {attachments.length > 0 && (
        <div className="grid gap-4">
          {attachments.map((att, i) => (
            <div key={i} className="flex gap-3 border rounded-lg p-3 bg-muted/20">
              {/* Preview da imagem */}
              <img
                src={att.preview}
                alt={att.title}
                className="w-24 h-24 object-cover rounded-md flex-shrink-0"
              />
              {/* Campos de título e descrição */}
              <div className="flex-1 space-y-2 min-w-0">
                <input
                  type="text"
                  placeholder="Título do passo *"
                  value={att.title}
                  onChange={(e) => updateField(i, "title", e.target.value)}
                  className="w-full text-sm border border-input rounded-md px-2 py-1 bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <textarea
                  placeholder="Descrição (opcional)"
                  value={att.description}
                  onChange={(e) => updateField(i, "description", e.target.value)}
                  rows={2}
                  className="w-full text-sm border border-input rounded-md px-2 py-1 bg-transparent resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              {/* Botão remover */}
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-muted-foreground hover:text-destructive flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
