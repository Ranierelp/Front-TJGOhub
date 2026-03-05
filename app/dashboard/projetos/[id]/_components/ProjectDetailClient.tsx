"use client";

// =============================================================================
// Tela 4 — Detalhe do Projeto
// Sub-header, bloco info/stats, tabs (Casos / Ambientes / Execuções).
// =============================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, AlertCircle, Edit2, Archive, Play } from "lucide-react";

import { useProjectDetail } from "@/hooks/useProjectDetail";
import { GlassBackground, GlassCard } from "../../_components/GlassBackground";
import { ArchiveModal } from "../../_components/ProjectModals";
import { TestCasesTab } from "./TestCasesTab";
import { EnvironmentsTab } from "./EnvironmentsTab";
import { RunsTab } from "./RunsTab";

type Tab = "cases" | "envs" | "runs";

const TABS: { id: Tab; label: string }[] = [
  { id: "cases", label: "🧪 Casos de Teste" },
  { id: "envs",  label: "🖥️ Ambientes" },
  { id: "runs",  label: "▶️ Execuções Recentes" },
];

export function ProjectDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { project, loading, error, archive } = useProjectDetail(id);
  const [activeTab, setActiveTab]  = useState<Tab>("cases");
  const [archiving, setArchiving]  = useState(false);

  async function handleArchive() {
    const ok = await archive();
    setArchiving(false);
    if (ok) toast.success("Projeto arquivado com sucesso");
    else    toast.error("Erro ao arquivar projeto");
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-64">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#3B82F6" }} />
    </div>
  );

  if (error || !project) return (
    <div className="flex flex-col items-center py-20 gap-3">
      <AlertCircle className="h-8 w-8" style={{ color: "#EF4444" }} />
      <p className="text-sm" style={{ color: "var(--col-muted)" }}>{error || "Projeto não encontrado"}</p>
    </div>
  );

  const date = new Date(project.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <GlassBackground />
      <div className="flex flex-col gap-5 animate-slide-up">

        {/* Sub-header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl">📂</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold" style={{ color: "var(--col-heading)", letterSpacing: "-0.03em" }}>
                  {project.name}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                  style={{
                    background: project.is_active ? "rgba(209,250,229,0.6)" : "rgba(254,226,226,0.6)",
                    color: project.is_active ? "#10B981" : "#EF4444",
                    border: `1px solid ${project.is_active ? "rgba(167,243,208,0.5)" : "rgba(252,165,165,0.5)"}`,
                  }}>
                  {project.is_active ? "⚡ Ativo" : "🔴 Arquivado"}
                </span>
              </div>
              <p className="text-xs font-mono mt-0.5" style={{ color: "var(--col-dim)" }}>/{project.slug}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {project.is_active && (
              <button onClick={() => setArchiving(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ border: "1px solid rgba(226,232,240,0.7)", color: "var(--col-muted)", background: "transparent" }}>
                <Archive size={14} /> Arquivar
              </button>
            )}
            <button onClick={() => router.push(`/dashboard/projetos/${id}/editar`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ border: "1px solid rgba(226,232,240,0.7)", color: "var(--col-muted)", background: "transparent" }}>
              <Edit2 size={14} /> Editar
            </button>
            <button className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#2563EB,#3B82F6)", boxShadow: "0 2px 10px rgba(37,99,235,0.25)" }}>
              <Play size={14} /> Nova Execução
            </button>
          </div>
        </div>

        {/* Info + Stats */}
        <div className="flex flex-col md:flex-row gap-4">
          <GlassCard className="flex-1 p-5 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#3B82F6" }}>📝 Sobre o Projeto</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--col-body)" }}>
              {project.description || <span style={{ color: "var(--col-dim)" }}>Sem descrição.</span>}
            </p>
            <div className="pt-3 space-y-1" style={{ borderTop: "1px solid rgba(226,232,240,0.3)" }}>
              <p className="text-xs" style={{ color: "var(--col-dim)" }}>
                Criado por <strong style={{ color: "var(--col-body)" }}>{project.created_by_name || "—"}</strong> em {date}
              </p>
            </div>
          </GlassCard>
          <div className="w-full md:w-72 grid grid-cols-2 gap-3">
            {[
              { emoji: "🧪", value: project.test_cases_count, label: "Casos" },
              { emoji: "🖥️", value: project.environments_count, label: "Ambientes" },
              { emoji: "▶️", value: project.test_runs_count,   label: "Execuções" },
              { emoji: "✅", value: 0,                          label: "Aprovados" },
            ].map((s) => (
              <GlassCard key={s.label} className="p-3 text-center">
                <p className="text-xl mb-1">{s.emoji}</p>
                <p className="text-xl font-extrabold" style={{ color: "var(--col-heading)" }}>{s.value}</p>
                <p className="text-xs" style={{ color: "var(--col-dim)" }}>{s.label}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: activeTab === t.id ? "rgba(255,255,255,0.9)" : "transparent",
                color: activeTab === t.id ? "#2563EB" : "var(--col-muted)",
                border: activeTab === t.id ? "1px solid rgba(147,197,253,0.4)" : "1px solid transparent",
                boxShadow: activeTab === t.id ? "0 2px 8px rgba(37,99,235,0.08)" : "none",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Conteúdo das tabs */}
        {activeTab === "cases" && <TestCasesTab projectId={id} />}
        {activeTab === "envs"  && <EnvironmentsTab projectId={id} />}
        {activeTab === "runs"  && <RunsTab projectId={id} />}
      </div>

      {archiving && project && (
        <ArchiveModal project={project as any} onConfirm={handleArchive} onCancel={() => setArchiving(false)} />
      )}
    </div>
  );
}
