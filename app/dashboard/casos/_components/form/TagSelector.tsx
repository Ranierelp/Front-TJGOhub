"use client";

// =============================================================================
// TagSelector — seletor de tags estilo Huly.
//
// Comportamento:
//   - Exibe tags selecionadas como badges coloridos com botão de remover.
//   - Botão "Add label" abre popover com busca + lista filtrada + botão "+"
//     que abre modal de criação (nome + paleta de cores).
//
// Renderização via Portal (Radix Popover + Radix Dialog) — fundamental pra
// não ser clipado pelos GlassCards da sidebar nem virar containing block
// quebrado por ancestrais com transform/filter.
// =============================================================================

import { useState, useRef } from "react";
import { Tag, Plus, X, Check, Search } from "lucide-react";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { NameAndColorModal } from "@/components/NameAndColorModal";

import type { FormTag } from "./CaseFormSidebar";

// Alias interno: a API pública do componente trabalha com a mesma forma de
// FormTag usada pela sidebar, evitando duplicar a interface.
export type TagOption = FormTag;

interface Props {
  tags:         TagOption[];
  selectedTags: string[];
  onToggleTag:  (id: string) => void;
  /** Deve criar a tag na API e retornar o objeto criado. */
  onCreateTag:  (name: string, color: string) => Promise<TagOption>;
}

// Paleta de cores fixa (mesma do Huly).
const COLOR_PALETTE = [
  "#EF4444", "#F87171", "#F472B6", "#EC4899",
  "#C084FC", "#A855F7", "#818CF8", "#6366F1",
  "#60A5FA", "#3B82F6", "#38BDF8", "#06B6D4",
  "#34D399", "#10B981", "#4ADE80", "#22C55E",
  "#A3E635", "#84CC16", "#FACC15", "#EAB308",
  "#FB923C", "#F97316", "#94A3B8", "#64748B", "#475569",
];

export function TagSelector({ tags, selectedTags, onToggleTag, onCreateTag }: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [createOpen,  setCreateOpen]  = useState(false);
  const [search,      setSearch]      = useState("");

  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = tags.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedTagObjects = tags.filter(t => selectedTags.includes(t.id));

  // Callback do NameAndColorModal: cria a tag e já marca como selecionada.
  // Re-lança o erro pra modal manter aberto em caso de falha (ex.: nome duplicado).
  const handleCreateTag = async (name: string, color: string) => {
    const created = await onCreateTag(name, color);
    onToggleTag(created.id);
  };

  // Reset da busca quando o popover fecha
  const handlePopoverChange = (open: boolean) => {
    setPopoverOpen(open);
    if (!open) setSearch("");
  };

  return (
    <div className="space-y-2">

      {/* Tags selecionadas (chips coloridos) */}
      <div className="flex flex-wrap gap-1.5 min-h-[24px]">
        {selectedTagObjects.map(tag => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all"
            style={{
              background: `${tag.color}22`,
              border:     `1px solid ${tag.color}55`,
              color:       tag.color,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: tag.color }}
            />
            {tag.name}
            <button
              type="button"
              onClick={() => onToggleTag(tag.id)}
              className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-black/10"
              aria-label={`Remover ${tag.name}`}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>

      {/* Botão "Add label" + Popover (Radix Portal) */}
      <Popover open={popoverOpen} onOpenChange={handlePopoverChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all"
            style={{
              color:      "var(--col-dim, #64748B)",
              background: "transparent",
              border:     "1px dashed rgba(100,116,139,0.35)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background  = "rgba(241,245,249,0.6)";
              e.currentTarget.style.borderColor = "rgba(100,116,139,0.6)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = "transparent";
              e.currentTarget.style.borderColor = "rgba(100,116,139,0.35)";
            }}
          >
            <Tag className="w-3 h-3" />
            Add label
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-[240px] p-0 overflow-hidden"
          style={{
            background: "var(--col-surface)",
            border:     "1px solid var(--glass-card-border)",
            boxShadow:  "0 8px 32px rgba(0,0,0,0.28)",
          }}
          onOpenAutoFocus={(e) => { e.preventDefault(); searchRef.current?.focus(); }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2.5"
            style={{ borderBottom: "1px solid var(--glass-card-border)" }}
          >
            <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--col-dim)" }} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="flex-1 bg-transparent text-[12.5px] outline-none"
              style={{ color: "var(--col-body)" }}
            />
            <button
              type="button"
              onClick={() => { setPopoverOpen(false); setCreateOpen(true); }}
              className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors"
              style={{ color: "var(--col-dim)" }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(100,116,139,0.12)";
                e.currentTarget.style.color      = "var(--col-body)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color      = "var(--col-dim)";
              }}
              title="Criar nova tag"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-[220px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-[11.5px] text-center" style={{ color: "var(--col-dim)" }}>
                Nenhuma tag encontrada
              </p>
            ) : (
              filtered.map(tag => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => onToggleTag(tag.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[12.5px] transition-colors"
                    style={{ color: "var(--col-body)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(100,116,139,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: tag.color }}
                    />
                    <span className="flex-1 truncate">{tag.name}</span>
                    {isSelected && (
                      <Check className="w-3 h-3 flex-shrink-0" style={{ color: tag.color }} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Modal de criação — componente compartilhado com o Kanban */}
      <NameAndColorModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateTag}
        title="Nova tag"
        nameLabel="Nome"
        colorLabel="Cor da tag"
        placeholder="Ex: Crítico, Smoke, Login…"
        submitLabel="Criar tag"
        colors={COLOR_PALETTE}
        defaultColor={COLOR_PALETTE[0]}
      />
    </div>
  );
}
