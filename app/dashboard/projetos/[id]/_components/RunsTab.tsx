"use client";

// Tab de Execuções Recentes

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight } from "lucide-react";
import { get, api } from "@/lib/api";
import { GlassCard } from "../../_components/GlassBackground";

interface Run {
  id: string;
  run_number?: number;
  executed_at: string;
  executed_by_name?: string;
  passed_count: number;
  failed_count: number;
  blocked_count: number;
  total_count: number;
}

interface DRFPage<T> { count: number; results: T[]; }

export function RunsTab({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [runs, setRuns]       = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<DRFPage<Run>>(api.endpoints.runs, {
      params: { project: projectId, limit: 10 },
    })
      .then((r) => setRuns(r.data.results))
      .catch(() => setRuns([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#3B82F6" }} />
    </div>
  );

  if (runs.length === 0) return (
    <GlassCard className="flex flex-col items-center py-12 gap-2">
      <span className="text-3xl">▶️</span>
      <p className="text-sm" style={{ color: "var(--col-muted)" }}>Nenhuma execução registrada</p>
    </GlassCard>
  );

  return (
    <div className="flex flex-col gap-3">
      {runs.map((run, idx) => {
        const total = run.total_count || 1;
        const passedPct  = Math.round((run.passed_count / total) * 100);
        const failedPct  = Math.round((run.failed_count / total) * 100);
        const blockedPct = 100 - passedPct - failedPct;
        const date = new Date(run.executed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

        return (
          <GlassCard key={run.id} interactive className="p-5 space-y-3"
            onClick={() => router.push(`/dashboard/execucoes/${run.id}`)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>▶️</span>
                <p className="text-sm font-bold" style={{ color: "var(--col-heading)" }}>
                  Execução #{run.run_number ?? idx + 1}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs" style={{ color: "var(--col-dim)" }}>{date} · {run.executed_by_name}</p>
                <ChevronRight size={14} style={{ color: "var(--col-dim)" }} />
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1" style={{ color: "#10B981" }}>✓ {run.passed_count} aprovados</span>
              <span className="flex items-center gap-1" style={{ color: "#EF4444" }}>✗ {run.failed_count} falhos</span>
              <span className="flex items-center gap-1" style={{ color: "#F59E0B" }}>⏸ {run.blocked_count} bloqueados</span>
            </div>

            {/* Barra de progresso */}
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
              <div style={{ width: `${passedPct}%`, background: "#10B981" }} />
              <div style={{ width: `${failedPct}%`, background: "#EF4444" }} />
              <div style={{ width: `${blockedPct}%`, background: "#F59E0B" }} />
            </div>

            <p className="text-xs font-semibold" style={{ color: "#10B981" }}>{passedPct}% aprovado</p>
          </GlassCard>
        );
      })}
    </div>
  );
}
