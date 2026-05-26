"use client";

// =============================================================================
// SearchableSelect — select com campo de busca.
//
// Quando ter 10+ opções, o <Select> simples obriga o usuário a scrollar. Esse
// componente usa Radix Popover + input filtrado pra resolver isso, mantendo o
// visual coerente com o <Select> do projeto.
//
// API mínima:
//   <SearchableSelect
//     value={projectId}
//     onValueChange={setProjectId}
//     options={[{ value: "uuid", label: "TJGOhub", badge: "12" }]}
//     placeholder="Selecione um projeto"
//   />
// =============================================================================

import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  /** Texto opcional à direita do label (ex.: contador "(12)"). */
  badge?: string;
}

interface Props {
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableOption[];

  placeholder?:      string;
  searchPlaceholder?: string;
  emptyMessage?:     string;

  /** Classes extras pro botão trigger. */
  triggerClassName?: string;
  /** Largura do popover. Default: 260px. */
  contentWidth?:     number;
}

export function SearchableSelect({
  value, onValueChange, options,
  placeholder       = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyMessage      = "Nada encontrado",
  triggerClassName,
  contentWidth      = 260,
}: Props) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => o.value === value);

  const filtered = useMemo(
    () => options.filter(o => o.label.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  );

  // Reseta a busca quando fecha
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-between gap-2 rounded-md border border-input bg-card",
            "px-3 py-[7px] text-xs font-semibold text-foreground transition-colors",
            "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
            triggerClassName,
          )}
        >
          <span className="truncate">
            {selectedOption ? (
              <>
                {selectedOption.label}
                {selectedOption.badge && (
                  <span className="ml-1 text-muted-foreground">({selectedOption.badge})</span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="p-0 overflow-hidden"
        style={{ width: contentWidth }}
        onOpenAutoFocus={(e) => { e.preventDefault(); searchRef.current?.focus(); }}
      >
        {/* Search */}
        <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 border-0 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Lista */}
        <div className="max-h-[260px] overflow-y-auto bg-popover py-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            filtered.map(option => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition-colors",
                    "text-foreground hover:bg-muted",
                    isSelected && "bg-muted/70",
                  )}
                >
                  <span className="truncate">
                    {option.label}
                    {option.badge && (
                      <span className="ml-1 text-muted-foreground">({option.badge})</span>
                    )}
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
