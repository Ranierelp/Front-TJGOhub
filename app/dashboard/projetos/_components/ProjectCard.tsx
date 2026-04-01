"use client";

// =============================================================================
// Card de projeto — modos grid e lista
// Recebe os dados e callbacks para as ações do menu contextual.
// =============================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Server, TestTube, ChevronRight } from "lucide-react";
import type { ProjectList } from "@/lib/api/projects";
import { GlassCard } from "./GlassBackground";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Props {
  project: ProjectList;
  mode: "grid" | "list";
  onArchive: (project: ProjectList) => void;
  onDelete: (project: ProjectList) => void;
}

// Badge de status (Ativo / Arquivado)
function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{
      background: isActive ? "rgba(209,250,229,0.6)" : "rgba(254,226,226,0.6)",
      color: isActive ? "#10B981" : "#EF4444",
      border: `1px solid ${isActive ? "rgba(167,243,208,0.5)" : "rgba(252,165,165,0.5)"}`,
    }}>
      {isActive ? "⚡ Ativo" : "🔴 Arquivado"}
    </span>
  );
}

// Menu de 3 pontos — usa Radix DropdownMenu para acessibilidade completa
// (fecha com Escape, gerencia foco, role="menuitem" automático)
function ContextMenu({ project, onArchive, onDelete }: Omit<Props, "mode">) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          style={{ color: "var(--col-muted)" }}
          aria-label="Opções do projeto"
        >
          <MoreHorizontal size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => router.push(`/dashboard/projetos/${project.id}/editar`)}>
          ✏️ Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onArchive(project)} className="text-amber-600 focus:text-amber-600">
          📦 Arquivar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(project)} className="text-red-600 focus:text-red-600">
          🗑️ Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProjectCard({ project, mode, onArchive, onDelete }: Props) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const goto = () => router.push(`/dashboard/projetos/${project.id}`);
  const emoji = project.is_active ? "📂" : "📦";
  const date = new Date(project.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  if (mode === "list") {
    return (
      <div
        onClick={goto}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onKeyDown={(e) => e.key === "Enter" && goto()}
        role="button"
        tabIndex={0}
        className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors"
        style={{ borderBottom: "1px solid var(--glass-inner-border)", background: hovered ? "rgba(239,246,255,0.4)" : "transparent" }}>
        <span className="text-xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--col-heading)" }}>{project.name}</p>
          <p className="text-xs font-mono mt-0.5" style={{ color: "var(--col-dim)" }}>/{project.slug}</p>
        </div>
        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--col-muted)" }}>
          <span>🖥️ {project.environments_count}</span>
          <span>🧪 {project.test_cases_count}</span>
        </div>
        <StatusBadge isActive={project.is_active} />
        <ContextMenu project={project} onArchive={onArchive} onDelete={onDelete} />
        <ChevronRight size={16} style={{ color: "var(--col-dim)", opacity: hovered ? 1 : 0, transition: "opacity 0.15s" }} />
      </div>
    );
  }

  return (
    <GlassCard interactive className="p-5 flex flex-col gap-4" onClick={goto}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: "linear-gradient(135deg,rgba(219,234,254,0.8),rgba(191,219,254,0.5))" }}>
            {emoji}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "var(--col-heading)" }}>{project.name}</p>
            <p className="text-xs font-mono mt-0.5 truncate" style={{ color: "var(--col-dim)" }}>/{project.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge isActive={project.is_active} />
          <ContextMenu project={project} onArchive={onArchive} onDelete={onDelete} />
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--col-muted)" }}>
        <span className="flex items-center gap-1"><Server size={12} /> {project.environments_count} amb.</span>
        <span className="flex items-center gap-1"><TestTube size={12} /> {project.test_cases_count} casos</span>
      </div>

      <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--glass-inner-border)" }}>
        <span className="text-xs" style={{ color: "var(--col-dim)" }}>
          {project.created_by_name ? `por ${project.created_by_name} • ` : ""}{date}
        </span>
        <span className="text-xs font-semibold transition-opacity" style={{ color: "#2563EB", opacity: hovered ? 1 : 0 }}>
          Abrir ›
        </span>
      </div>
    </GlassCard>
  );
}
