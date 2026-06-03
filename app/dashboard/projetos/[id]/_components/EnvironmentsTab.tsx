"use client";

// Tab de Ambientes — lista, cria e arquiva ambientes vinculados ao projeto

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Globe, Trash2, Server } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "../../_components/GlassBackground";
import { SimpleDeleteModal, Overlay } from "../../_components/ProjectModals";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import {
  listEnvironments, createEnvironment, archiveEnvironment,
  type EnvironmentItem,
} from "@/lib/api/environments";

// ── Estilos por tipo de ambiente ─────────────────────────────────────────────
const ENV_STYLE = {
  development: { label: "Desenvolvimento", bg: "rgba(219,234,254,0.6)", color: "#1D4ED8", border: "rgba(147,197,253,0.4)" },
  staging:     { label: "Homologação",     bg: "rgba(254,243,199,0.6)", color: "#92400E", border: "rgba(253,230,138,0.4)" },
  production:  { label: "Produção",        bg: "rgba(254,226,226,0.6)", color: "#991B1B", border: "rgba(252,165,165,0.4)" },
} as const;

// ── Modal de criação ─────────────────────────────────────────────────────────
function CreateEnvModal({ projectId, onSuccess, onCancel }: {
  projectId: string; onSuccess: () => void; onCancel: () => void;
}) {
  const [envType,    setEnvType]    = useState("development");
  const [baseUrl,    setBaseUrl]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isValid = baseUrl.trim().length > 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try {
      await createEnvironment({ project: projectId, base_url: baseUrl.trim(), env_type: envType });
      toast.success("Ambiente criado com sucesso");
      onSuccess();
    } catch (err: any) {
      const msg = err?.details?.env_type?.[0] ?? err?.details?.base_url?.[0] ?? "Erro ao criar ambiente";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Overlay>
      <div className="w-full max-w-sm p-6 rounded-2xl space-y-4" style={{
        background: "var(--glass-card-bg)", backdropFilter: "blur(24px)",
        border: "1px solid var(--glass-card-border)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div className="flex items-center gap-3">
          <Server size={20} style={{ color: "#3B82F6" }} />
          <h2 className="text-lg font-extrabold" style={{ color: "var(--col-heading)" }}>Novo Ambiente</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--col-muted)" }}>Tipo</label>
            <Select value={envType} onValueChange={setEnvType}>
              <SelectTrigger className="w-full" placeholder="Selecione o tipo" />
              <SelectContent>
                <SelectItem value="development">Desenvolvimento</SelectItem>
                <SelectItem value="staging">Homologação</SelectItem>
                <SelectItem value="production">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--col-muted)" }}>URL Base</label>
            <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://dev.tjgo.jus.br"
              className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ border: "1px solid var(--glass-inner-border)", color: "var(--col-muted)", background: "transparent" }}>
              Cancelar
            </button>
            <button type="submit" disabled={!isValid || submitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              style={{
                background: isValid ? "linear-gradient(135deg,#2563EB,#3B82F6)" : "var(--glass-inner-border)",
                color: isValid ? "white" : "var(--col-dim)",
                cursor: isValid ? "pointer" : "not-allowed",
              }}>
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Criar
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

// ── Tab principal ────────────────────────────────────────────────────────────
export function EnvironmentsTab({ projectId }: { projectId: string }) {
  const [envs,        setEnvs]    = useState<EnvironmentItem[]>([]);
  const [loading,     setLoading] = useState(true);
  const [creating,    setCreating] = useState(false);
  const [deleteTarget, setTarget] = useState<EnvironmentItem | null>(null);

  const fetchEnvs = useCallback(() => {
    setLoading(true);
    listEnvironments({ project: projectId })
      .then((r) => setEnvs(r.data.results))
      .catch(() => setEnvs([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { fetchEnvs(); }, [fetchEnvs]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await archiveEnvironment(deleteTarget.id);
      toast.success("Ambiente arquivado com sucesso");
      setTarget(null);
      fetchEnvs();
    } catch {
      toast.error("Erro ao arquivar ambiente");
      setTarget(null);
    }
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#3B82F6" }} />
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {envs.map((env) => {
          const s = ENV_STYLE[env.env_type] ?? ENV_STYLE.development;
          return (
            <GlassCard key={env.id} className="p-5 space-y-3">
              {/* Tipo + status + botão excluir */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                  style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                  {s.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md"
                    style={{
                      background: env.is_active ? "var(--success-bg)"   : "var(--danger-bg)",
                      color:      env.is_active ? "var(--success-fg)"   : "var(--danger-fg)",
                      border:     `1px solid ${env.is_active ? "var(--success-border)" : "var(--danger-border)"}`,
                    }}>
                    <span className="h-[5px] w-[5px] rounded-full" style={{ background: "currentColor" }} />
                    {env.is_active ? "Ativo" : "Inativo"}
                  </span>
                  <button onClick={() => setTarget(env)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                    style={{ color: "var(--col-dim)" }} title="Arquivar ambiente">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              {/* URL */}
              <div className="flex items-center gap-2">
                <Globe size={13} style={{ color: "var(--col-dim)", flexShrink: 0 }} />
                <p className="text-xs font-mono truncate" style={{ color: "var(--col-body)" }}>{env.base_url}</p>
              </div>
            </GlassCard>
          );
        })}

        {/* Card "Novo Ambiente" */}
        <button onClick={() => setCreating(true)}
          className="p-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all"
          style={{ border: "1.5px dashed var(--brand-solid)", background: "var(--brand-bg)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-glow)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--brand-bg)"; }}>
          <Plus size={20} style={{ color: "var(--brand-fg)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--brand-fg)" }}>Novo Ambiente</p>
        </button>
      </div>

      {creating && (
        <CreateEnvModal
          projectId={projectId}
          onSuccess={() => { setCreating(false); fetchEnvs(); }}
          onCancel={() => setCreating(false)}
        />
      )}

      {deleteTarget && (
        <SimpleDeleteModal
          title="Arquivar Ambiente?"
          description={`${ENV_STYLE[deleteTarget.env_type]?.label ?? deleteTarget.env_type} — ${deleteTarget.base_url}`}
          onConfirm={handleDelete}
          onCancel={() => setTarget(null)}
        />
      )}
    </>
  );
}
