"use client";

// Tab de Ambientes — lista os ambientes vinculados ao projeto

import { useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { get, api } from "@/lib/api";
import { GlassCard } from "../../_components/GlassBackground";

interface Environment {
  id: string;
  name: string;
  base_url: string;
  is_active: boolean;
}

interface DRFPage<T> { count: number; results: T[]; }

export function EnvironmentsTab({ projectId }: { projectId: string }) {
  const [envs, setEnvs]       = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<DRFPage<Environment>>(api.endpoints.environments, {
      params: { project: projectId },
    })
      .then((r) => setEnvs(r.data.results))
      .catch(() => setEnvs([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#3B82F6" }} />
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {envs.map((env) => (
        <GlassCard key={env.id} interactive className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color: "var(--col-heading)" }}>{env.name}</p>
            {/* Indicador online/offline */}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: env.is_active ? "#10B981" : "#EF4444" }} />
              <span className="text-xs font-medium" style={{ color: env.is_active ? "#10B981" : "#EF4444" }}>
                {env.is_active ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          <p className="text-xs font-mono truncate" style={{ color: "var(--col-dim)" }}>{env.base_url}</p>
        </GlassCard>
      ))}

      {/* Card "Novo Ambiente" */}
      <GlassCard className="p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-300 transition-colors"
        style={{ border: "2px dashed rgba(147,197,253,0.5)", background: "rgba(239,246,255,0.3)" }}>
        <Plus size={20} style={{ color: "#3B82F6" }} />
        <p className="text-sm font-semibold" style={{ color: "#3B82F6" }}>Novo Ambiente</p>
      </GlassCard>
    </div>
  );
}
