"use client";

// Tab de Casos de Teste — busca da API de test-cases filtrado por projeto

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Loader2, FileText, ChevronRight } from "lucide-react";
import { get, api } from "@/lib/api";
import { GlassCard } from "../../_components/GlassBackground";

interface TestCase {
  id: string;
  case_id: string;
  title: string;
  status: "DRAFT" | "ACTIVE" | "DEPRECATED";
  module?: string;
}

interface DRFPage<T> { count: number; results: T[]; }

const STATUS_STYLE = {
  DRAFT:      { label: "Rascunho",  bg: "linear-gradient(135deg,#FEF3C7,#FDE68A)",  color: "#92400E" },
  ACTIVE:     { label: "Ativo",     bg: "linear-gradient(135deg,#D1FAE5,#A7F3D0)",  color: "#065F46" },
  DEPRECATED: { label: "Depreciado",bg: "linear-gradient(135deg,#FEE2E2,#FECACA)", color: "#991B1B" },
};

export function TestCasesTab({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [cases, setCases]     = useState<TestCase[]>([]);
  const [count, setCount]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    setLoading(true);
    get<DRFPage<TestCase>>(api.endpoints.testCases, {
      params: { project: projectId, search: search || undefined, limit: 20 },
    })
      .then((r) => { setCases(r.data.results); setCount(r.data.count); })
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, [projectId, search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--col-dim)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar casos..." className="glass-input w-full pl-9 pr-3.5 py-2 rounded-xl text-sm" />
        </div>
        <button onClick={() => router.push("/dashboard/casos/novo")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{ border: "2px dashed rgba(147,197,253,0.5)", color: "#3B82F6", background: "rgba(239,246,255,0.4)" }}>
          <Plus size={14} /> Novo Caso
        </button>
      </div>

      <GlassCard>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "#3B82F6" }} /></div>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <FileText className="h-8 w-8" style={{ color: "var(--col-dim)" }} />
            <p className="text-sm" style={{ color: "var(--col-muted)" }}>Nenhum caso de teste</p>
          </div>
        ) : (
          <>
            <div className="grid px-5 py-3 text-xs font-bold uppercase tracking-wider"
              style={{ gridTemplateColumns: "90px 1fr 120px 24px", color: "var(--col-dim)", borderBottom: "1px solid rgba(226,232,240,0.5)", background: "var(--glass-card-header)", borderRadius: "16px 16px 0 0" }}>
              <span>ID</span><span>Título</span><span>Status</span><span />
            </div>
            {cases.map((tc) => {
              const s = STATUS_STYLE[tc.status] ?? STATUS_STYLE.DRAFT;
              return (
                <div key={tc.id} onClick={() => router.push(`/dashboard/casos/${tc.id}`)}
                  className="grid items-center px-5 py-3.5 cursor-pointer hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
                  style={{ gridTemplateColumns: "90px 1fr 120px 24px", borderBottom: "1px solid rgba(226,232,240,0.3)" }}>
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg"
                    style={{ background: "linear-gradient(135deg,rgba(219,234,254,0.8),rgba(191,219,254,0.5))", color: "#1D4ED8" }}>
                    {tc.case_id}
                  </span>
                  <div>
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--col-body)" }}>{tc.title}</p>
                    {tc.module && <p className="text-xs" style={{ color: "var(--col-dim)" }}>{tc.module}</p>}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  <ChevronRight size={14} style={{ color: "var(--col-dim)" }} />
                </div>
              );
            })}
          </>
        )}
      </GlassCard>
    </div>
  );
}
