"use client";

// =============================================================================
// Card de projeto — modos grid e lista
// Recebe os dados e callbacks para as ações do menu contextual.
// =============================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Server, TestTube, Play, ChevronRight } from "lucide-react";
import type { ProjectList } from "@/lib/api/projects";
import { GlassCard } from "./GlassBackground";

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
      background: isActive ? "rgba(209,250,229,0.6)" : "rgba(241,245,249,0.6)",
      color: isActive ? "#10B981" : "#64748B",
      border: `1px solid ${isActive ? "rgba(167,243,208,0.5)" : "rgba(226,232,240,0.5)"}`,
    }}>
      {isActive ? "⚡ Ativo" : "📦 Arquivado"}
    </span>
  );
}

// Menu de 3 pontos
function ContextMenu({ project, onArchive, onDelete }: Omit<Props, "mode">) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <div className="relative">
      <button onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        style={{ color: "var(--col-muted)" }}>
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-40 rounded-xl overflow-hidden"
            style={{ background: "var(--glass-card-bg)", border: "1px solid var(--glass-card-border)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", backdropFilter: "blur(16px)" }}>
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); router.push(`/dashboard/projetos/${project.id}/editar`); }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" style={{ color: "var(--col-body)" }}>
              ✏️ Editar
            </button>
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); onArchive(project); }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" style={{ color: "#F59E0B" }}>
              📦 Arquivar
            </button>
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(project); }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" style={{ color: "#EF4444" }}>
              🗑️ Excluir
            </button>
          </div>
        </>
      )}
    </div>
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
      <div onClick={goto} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors"
        style={{ borderBottom: "1px solid rgba(226,232,240,0.3)", background: hovered ? "rgba(239,246,255,0.4)" : "transparent" }}>
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

      <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(226,232,240,0.3)" }}>
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
