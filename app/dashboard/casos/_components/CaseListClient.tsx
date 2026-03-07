"use client";

import { useState }    from "react";
import { useRouter }   from "next/navigation";
import { Plus, Search, Loader2, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useCaseList, type TestCaseRow } from "@/hooks/useCaseList";
import { useProjects }                   from "@/hooks/useProjects";
import { del, api }                      from "@/lib/api";
import { SimpleDeleteModal }             from "@/app/dashboard/projetos/_components/ProjectModals";
import { GlassCard, CasePageBackground } from "@/app/dashboard/casos/_components/CaseShared";

// ── Configuração visual dos status ─────────────────────────────────────────
const STATUS = {
  DRAFT:      { label: "Rascunho",   bg: "linear-gradient(135deg,#FEF3C7,#FDE68A)", color: "#92400E" },
  ACTIVE:     { label: "Ativo",      bg: "linear-gradient(135deg,#D1FAE5,#A7F3D0)", color: "#065F46" },
  DEPRECATED: { label: "Depreciado", bg: "linear-gradient(135deg,#FEE2E2,#FECACA)", color: "#991B1B" },
} as const;

// Colunas: ID | Título | Projeto | Status | Tags | Excluir
const GRID = "90px 1fr 150px 115px 1fr 32px";

interface CaseRowProps {
  tc: TestCaseRow;
  onClick: () => void;
  onDelete: (tc: TestCaseRow) => void;
}

function CaseRow({ tc, onClick, onDelete }: CaseRowProps) {
  const s = STATUS[tc.status] ?? STATUS.DRAFT;
  return (
    <div
      className="grid gap-4 px-5 py-3.5 items-center hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors"
      style={{
        gridTemplateColumns: GRID,
        borderBottom: "1px solid var(--glass-inner-border)",
      }}>

      {/* case_id */}
      <span onClick={onClick} className="cursor-pointer text-xs font-mono font-bold px-2 py-1 rounded-lg inline-block"
        style={{ background: "linear-gradient(135deg,rgba(219,234,254,0.8),rgba(191,219,254,0.5))", color: "#1D4ED8" }}>
        {tc.case_id}
      </span>

      {/* título + módulo */}
      <div onClick={onClick} className="min-w-0 cursor-pointer">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--col-body)" }}>{tc.title}</p>
        {tc.module && <p className="text-xs truncate mt-0.5" style={{ color: "var(--col-dim)" }}>{tc.module}</p>}
      </div>

      {/* projeto */}
      <span onClick={onClick} className="text-xs truncate cursor-pointer" style={{ color: "var(--col-muted)" }}>{tc.project_name}</span>

      {/* status */}
      <span onClick={onClick} className="cursor-pointer inline-flex items-center justify-center text-xs font-semibold px-2.5 py-1 rounded-lg"
        style={{ background: s.bg, color: s.color }}>
        {s.label}
      </span>

      {/* tags */}
      <div onClick={onClick} className="flex flex-wrap gap-1 cursor-pointer">
        {tc.tags.slice(0, 3).map(tag => (
          <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "var(--glass-field-bg)", color: "var(--col-muted)", border: "1px solid var(--glass-inner-border)" }}>
            {tag.name}
          </span>
        ))}
        {tc.tags.length > 3 && <span className="text-xs" style={{ color: "var(--col-dim)" }}>+{tc.tags.length - 3}</span>}
      </div>

      {/* Botão excluir — stopPropagation para não abrir o detalhe */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(tc); }}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
        style={{ color: "var(--col-dim)" }}
        title="Excluir caso">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export function CaseListClient() {
  const router = useRouter();
  const { cases, count, loading, page, setPage, totalPages,
          search, setSearch, statusFilter, updateStatus,
          projectFilter, updateProject, refetch } = useCaseList();
  const { projects } = useProjects();
  const [deleteTarget, setDeleteTarget] = useState<TestCaseRow | null>(null);

  const start = count === 0 ? 0 : (page - 1) * 10 + 1;
  const end   = Math.min(page * 10, count);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await del(`${api.endpoints.testCases}${deleteTarget.id}/`);
      toast.success(`Caso ${deleteTarget.case_id} excluído com sucesso`);
      refetch();
      router.refresh();
    } catch {
      toast.error("Erro ao excluir caso de teste");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>

      <CasePageBackground />

      <div className="flex flex-col gap-5">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--col-dim)" }}>Casos de Teste</p>
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
          <button onClick={() => router.push("/dashboard/casos/novo")}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#2563EB,#3B82F6)", boxShadow: "0 2px 10px rgba(37,99,235,0.25)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,#1D4ED8,#2563EB)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,#2563EB,#3B82F6)"; e.currentTarget.style.transform = "none"; }}>
            <Plus className="h-4 w-4" /> Novo Caso
          </button>
        </div>

        {/* Filtros */}
        <GlassCard className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--col-dim)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por ID, título, módulo..."
                className="glass-input w-full pl-9 pr-3.5 py-2 rounded-xl text-sm" />
            </div>
            <select value={statusFilter} onChange={e => updateStatus(e.target.value)}
              className="glass-input px-3.5 py-2 rounded-xl text-sm appearance-none">
              <option value="">Todos os status</option>
              <option value="DRAFT">Rascunho</option>
              <option value="ACTIVE">Ativo</option>
              <option value="DEPRECATED">Depreciado</option>
            </select>
            <select value={projectFilter} onChange={e => updateProject(e.target.value)}
              className="glass-input px-3.5 py-2 rounded-xl text-sm appearance-none">
              <option value="">Todos os projetos</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </GlassCard>

        {/* Tabela */}
        <GlassCard>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#3B82F6" }} />
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,rgba(219,234,254,0.8),rgba(191,219,254,0.5))", border: "1px solid rgba(147,197,253,0.3)" }}>
                <FileText className="h-6 w-6" style={{ color: "#3B82F6" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--col-muted)" }}>Nenhum caso encontrado</p>
              <p className="text-xs" style={{ color: "var(--col-dim)" }}>Ajuste os filtros ou crie um novo caso de teste</p>
            </div>
          ) : (
            <>
              {/* Cabeçalho da tabela */}
              <div className="grid gap-4 px-5 py-3 text-xs font-bold uppercase tracking-wider"
                style={{
                  gridTemplateColumns: GRID,
                  color: "var(--col-dim)",
                  borderBottom: "1px solid var(--glass-inner-border)",
                  background: "var(--glass-card-header)",
                  borderRadius: "16px 16px 0 0",
                }}>
                <span>ID</span>
                <span>Título</span>
                <span>Projeto</span>
                <span>Status</span>
                <span>Tags</span>
                <span />
              </div>
              {cases.map(tc => (
                <CaseRow
                  key={tc.id}
                  tc={tc}
                  onClick={() => router.push(`/dashboard/casos/${tc.id}/`)}
                  onDelete={setDeleteTarget}
                />
              ))}
            </>
          )}
        </GlassCard>

        {/* Paginação */}
        {!loading && count > 10 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs" style={{ color: "var(--col-dim)" }}>
              Mostrando {start}–{end} de {count}
            </span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  page === 1
                    ? "text-slate-300 dark:text-slate-600 bg-slate-50/40 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700 cursor-not-allowed"
                    : "bg-white/80 dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
                style={{ color: page === 1 ? undefined : "var(--col-muted)" }}>
                ← Anterior
              </button>
              <span className="text-xs font-medium px-2" style={{ color: "var(--col-muted)" }}>
                {page} / {totalPages}
              </span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  page === totalPages
                    ? "text-slate-300 dark:text-slate-600 bg-slate-50/40 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700 cursor-not-allowed"
                    : "bg-white/80 dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
                style={{ color: page === totalPages ? undefined : "var(--col-muted)" }}>
                Próxima →
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Modal de confirmação de exclusão */}
      {deleteTarget && (
        <SimpleDeleteModal
          title="Excluir Caso de Teste?"
          description={`${deleteTarget.case_id} — ${deleteTarget.title}`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
