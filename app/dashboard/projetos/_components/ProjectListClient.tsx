"use client";

// =============================================================================
// Tela 1 — Listagem de Projetos
// =============================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, LayoutGrid, List, Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

import { useProjectList, type StatusFilter } from "@/hooks/useProjectList";
import { archiveProject, deleteProject, type ProjectList } from "@/lib/api/projects";
import { GlassBackground, GlassCard } from "./GlassBackground";
import { ProjectCard } from "./ProjectCard";
import { ArchiveModal, DeleteModal } from "./ProjectModals";

type ViewMode = "grid" | "list";

// Cartão de estatística (barra superior)
function StatCard({ emoji, value, label }: { emoji: string; value: number; label: string }) {
  return (
    <GlassCard className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
        style={{ background: "linear-gradient(135deg,rgba(219,234,254,0.8),rgba(191,219,254,0.5))" }}>
        {emoji}
      </div>
      <div>
        <p className="text-2xl font-extrabold leading-none" style={{ color: "var(--col-heading)" }}>{value}</p>
        <p className="text-xs mt-1" style={{ color: "var(--col-dim)" }}>{label}</p>
      </div>
    </GlassCard>
  );
}

// Toggle de filtros de status
const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "archived", label: "Arquivados" },
];

export function ProjectListClient() {
  const router = useRouter();
  const { projects, count, loading, page, setPage, totalPages, search, setSearch, statusFilter, setStatusFilter, refetch } = useProjectList();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [archiveTarget, setArchiveTarget] = useState<ProjectList | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<ProjectList | null>(null);

  // Stats derivados da lista atual
  const active   = projects.filter((p) => p.is_active).length;
  const cases    = projects.reduce((sum, p) => sum + p.test_cases_count, 0);

  async function handleArchive() {
    if (!archiveTarget) return;
    try {
      await archiveProject(archiveTarget.id);
      toast.success("Projeto arquivado com sucesso");
      setArchiveTarget(null);
      refetch();
    } catch { toast.error("Erro ao arquivar projeto"); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteProject(deleteTarget.id);
      toast.success("Projeto excluído com sucesso");
      setDeleteTarget(null);
      refetch();
    } catch { toast.error("Erro ao excluir projeto"); }
  }

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <GlassBackground />

      <div className="flex flex-col gap-5">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--col-dim)" }}>📁 Projetos</p>
            <h1 className="text-xl font-extrabold flex items-center gap-2" style={{ color: "var(--col-heading)", letterSpacing: "-0.03em" }}>
              Listagem
              {count > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#DBEAFE,#EFF6FF)", color: "#2563EB", border: "1px solid rgba(147,197,253,0.4)" }}>
                  {count}
                </span>
              )}
            </h1>
          </div>
          <button onClick={() => router.push("/dashboard/projetos/novo")}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#2563EB,#3B82F6)", boxShadow: "0 2px 10px rgba(37,99,235,0.25)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg,#1D4ED8,#2563EB)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg,#2563EB,#3B82F6)"; e.currentTarget.style.transform = "none"; }}>
            <Plus size={16} /> Novo Projeto
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard emoji="📁" value={count}  label="Total de Projetos" />
          <StatCard emoji="⚡" value={active} label="Projetos Ativos" />
          <StatCard emoji="🧪" value={cases}  label="Casos de Teste" />
          <StatCard emoji="▶️" value={0}       label="Execuções" />
        </div>

        {/* Filtros */}
        <GlassCard className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--col-dim)" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar projetos..." className="glass-input w-full pl-9 pr-3.5 py-2 rounded-xl text-sm" />
            </div>
            <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--glass-inner-border)" }}>
              {FILTERS.map((f) => (
                <button key={f.value} onClick={() => setStatusFilter(f.value)}
                  className="px-4 py-2 text-sm font-medium transition-all"
                  style={{
                    background: statusFilter === f.value ? "linear-gradient(135deg,#2563EB,#3B82F6)" : "transparent",
                    color: statusFilter === f.value ? "white" : "var(--col-muted)",
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--glass-inner-border)" }}>
              {(["grid", "list"] as ViewMode[]).map((m) => (
                <button key={m} onClick={() => setViewMode(m)}
                  className="px-3 py-2 transition-all"
                  style={{ background: viewMode === m ? "linear-gradient(135deg,#2563EB,#3B82F6)" : "transparent", color: viewMode === m ? "white" : "var(--col-muted)" }}>
                  {m === "grid" ? <LayoutGrid size={16} /> : <List size={16} />}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "#3B82F6" }} /></div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: "linear-gradient(135deg,rgba(219,234,254,0.8),rgba(191,219,254,0.5))" }}>
              <FolderOpen className="h-6 w-6" style={{ color: "#3B82F6" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--col-muted)" }}>Nenhum projeto encontrado</p>
            <p className="text-xs" style={{ color: "var(--col-dim)" }}>Crie seu primeiro projeto clicando em "Novo Projeto"</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} mode="grid" onArchive={setArchiveTarget} onDelete={setDeleteTarget} />
            ))}
          </div>
        ) : (
          <GlassCard>
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} mode="list" onArchive={setArchiveTarget} onDelete={setDeleteTarget} />
            ))}
          </GlassCard>
        )}

        {/* Paginação */}
        {!loading && count > 10 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs" style={{ color: "var(--col-dim)" }}>Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-4 py-1.5 rounded-xl text-xs font-medium"
                style={{ background: "var(--glass-card-bg)", border: "1px solid var(--glass-inner-border)", color: page === 1 ? "var(--col-dim)" : "var(--col-muted)", cursor: page === 1 ? "not-allowed" : "pointer" }}>
                ← Anterior
              </button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-4 py-1.5 rounded-xl text-xs font-medium"
                style={{ background: "var(--glass-card-bg)", border: "1px solid var(--glass-inner-border)", color: page === totalPages ? "var(--col-dim)" : "var(--col-muted)", cursor: page === totalPages ? "not-allowed" : "pointer" }}>
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>

      {archiveTarget && <ArchiveModal project={archiveTarget} onConfirm={handleArchive} onCancel={() => setArchiveTarget(null)} />}
      {deleteTarget  && <DeleteModal  project={deleteTarget}  onConfirm={handleDelete}  onCancel={() => setDeleteTarget(null)}  />}
    </div>
  );
}
