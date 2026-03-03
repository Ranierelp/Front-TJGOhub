"use client";

import { useState }    from "react";
import { useRouter }   from "next/navigation";
import { Plus, Search, Loader2, FileText } from "lucide-react";

import { useCaseList, type TestCaseRow } from "@/hooks/useCaseList";
import { useProjects }                   from "@/hooks/useProjects";

// ── Configuração visual dos status ─────────────────────────────────────────
const STATUS = {
  DRAFT:      { label: "Rascunho",   bg: "linear-gradient(135deg,#FEF3C7,#FDE68A)", color: "#92400E" },
  ACTIVE:     { label: "Ativo",       bg: "linear-gradient(135deg,#D1FAE5,#A7F3D0)", color: "#065F46" },
  DEPRECATED: { label: "Depreciado",  bg: "linear-gradient(135deg,#FEE2E2,#FECACA)", color: "#991B1B" },
} as const;

// ── Mini-componentes ────────────────────────────────────────────────────────
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl ${className}`} style={{
      background: "rgba(255,255,255,0.72)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 1px 4px rgba(0,0,0,0.03),0 4px 16px rgba(0,0,0,0.02)",
    }}>
      {children}
    </div>
  );
}

function CaseRow({ tc, onClick }: { tc: TestCaseRow; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const s = STATUS[tc.status] ?? STATUS.DRAFT;
  return (
    <div onClick={onClick}
      className="grid gap-4 px-5 py-3.5 cursor-pointer items-center"
      style={{
        gridTemplateColumns: "90px 1fr 150px 115px 160px",
        borderBottom: "1px solid rgba(226,232,240,0.3)",
        background: hovered ? "rgba(239,246,255,0.4)" : "transparent",
        transition: "background 0.15s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      {/* case_id */}
      <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg inline-block"
        style={{ background: "linear-gradient(135deg,rgba(219,234,254,0.8),rgba(191,219,254,0.5))", color: "#1D4ED8" }}>
        {tc.case_id}
      </span>

      {/* título + módulo */}
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#1E293B" }}>{tc.title}</p>
        {tc.module && <p className="text-xs truncate mt-0.5" style={{ color: "#94A3B8" }}>{tc.module}</p>}
      </div>

      {/* projeto */}
      <span className="text-xs truncate" style={{ color: "#64748B" }}>{tc.project_name}</span>

      {/* status */}
      <span className="inline-flex items-center justify-center text-xs font-semibold px-2.5 py-1 rounded-lg"
        style={{ background: s.bg, color: s.color }}>
        {s.label}
      </span>

      {/* tags */}
      <div className="flex flex-wrap gap-1">
        {tc.tags.slice(0, 3).map(tag => (
          <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(241,245,249,0.8)", color: "#64748B", border: "1px solid rgba(226,232,240,0.7)" }}>
            {tag.name}
          </span>
        ))}
        {tc.tags.length > 3 && (
          <span className="text-xs" style={{ color: "#94A3B8" }}>+{tc.tags.length - 3}</span>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export function CaseListClient() {
  const router = useRouter();
  const { cases, count, loading, page, setPage, totalPages,
          search, setSearch, statusFilter, updateStatus,
          projectFilter, updateProject } = useCaseList();
  const { projects } = useProjects();

  const start = count === 0 ? 0 : (page - 1) * 10 + 1;
  const end   = Math.min(page * 10, count);

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>

      {/* Fundo animado */}
      <div className="fixed inset-0 -z-10" style={{ background: "#F0F4FA" }}>
        <div className="absolute" style={{ width: 600, height: 600, top: -100, right: -100, background: "radial-gradient(circle,rgba(59,130,246,0.08) 0%,transparent 70%)", borderRadius: "50%", filter: "blur(40px)", animation: "float1 20s ease-in-out infinite" }} />
        <div className="absolute" style={{ width: 500, height: 500, bottom: -50, left: -100, background: "radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 70%)", borderRadius: "50%", filter: "blur(40px)", animation: "float2 25s ease-in-out infinite" }} />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(148,163,184,0.12) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
      </div>

      <div className="flex flex-col gap-5">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium" style={{ color: "#94A3B8" }}>Casos de Teste</p>
            <h1 className="text-xl font-extrabold flex items-center gap-2" style={{ color: "#0F172A", letterSpacing: "-0.03em" }}>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#94A3B8" }} />
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
              <p className="text-sm font-medium" style={{ color: "#64748B" }}>Nenhum caso encontrado</p>
              <p className="text-xs" style={{ color: "#94A3B8" }}>Ajuste os filtros ou crie um novo caso de teste</p>
            </div>
          ) : (
            <>
              {/* Cabeçalho da tabela */}
              <div className="grid gap-4 px-5 py-3 text-xs font-bold uppercase tracking-wider"
                style={{
                  gridTemplateColumns: "90px 1fr 150px 115px 160px",
                  color: "#94A3B8",
                  borderBottom: "1px solid rgba(226,232,240,0.5)",
                  background: "linear-gradient(135deg,rgba(239,246,255,0.6),rgba(248,250,252,0.4))",
                  borderRadius: "16px 16px 0 0",
                }}>
                <span>ID</span>
                <span>Título</span>
                <span>Projeto</span>
                <span>Status</span>
                <span>Tags</span>
              </div>
              {cases.map(tc => (
                <CaseRow key={tc.id} tc={tc} onClick={() => router.push(`/dashboard/casos/${tc.id}/`)} />
              ))}
            </>
          )}
        </GlassCard>

        {/* Paginação */}
        {!loading && count > 10 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs" style={{ color: "#94A3B8" }}>
              Mostrando {start}–{end} de {count}
            </span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: page === 1 ? "rgba(241,245,249,0.4)" : "rgba(255,255,255,0.8)",
                  color: page === 1 ? "#CBD5E1" : "#475569",
                  border: "1px solid rgba(226,232,240,0.7)",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                }}>
                ← Anterior
              </button>
              <span className="text-xs font-medium px-2" style={{ color: "#64748B" }}>
                {page} / {totalPages}
              </span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-4 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: page === totalPages ? "rgba(241,245,249,0.4)" : "rgba(255,255,255,0.8)",
                  color: page === totalPages ? "#CBD5E1" : "#475569",
                  border: "1px solid rgba(226,232,240,0.7)",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                }}>
                Próxima →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
