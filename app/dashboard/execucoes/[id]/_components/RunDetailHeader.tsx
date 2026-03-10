// Cabecalho da pagina de detalhe: botao voltar + card com info da run
// (projeto, ambiente, branch, commit, quem acionou, trigger type)

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, GitBranch, GitCommit, User, Clock, Zap } from "lucide-react";
import { GlassCard } from "../../../projetos/_components/GlassBackground";
import { StatusBadge } from "../../_components/StatusBadge";
import type { TestRunDetail } from "@/lib/api/runs";

interface RunDetailHeaderProps {
  run: TestRunDetail;
}

export function RunDetailHeader({ run }: RunDetailHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      {/* Botao voltar */}
      <button
        onClick={() => router.push("/dashboard/execucoes")}
        className="flex items-center gap-2 text-sm w-fit transition-opacity hover:opacity-70"
        style={{ color: "var(--col-muted)" }}
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar para Execucoes
      </button>

      {/* Card principal de info */}
      <GlassCard className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs" style={{ color: "var(--col-dim)" }}>
              {run.project_name}
              {run.environment_name && ` · ${run.environment_name}`}
            </p>
            <h1
              className="text-xl font-extrabold"
              style={{ color: "var(--col-heading)", letterSpacing: "-0.03em" }}
            >
              {run.run_id}
            </h1>

            {/* Metadados em linha */}
            <div
              className="flex flex-wrap gap-3 mt-2 text-xs"
              style={{ color: "var(--col-muted)" }}
            >
              {run.branch && (
                <span className="flex items-center gap-1">
                  <GitBranch size={12} aria-hidden="true" /> {run.branch}
                </span>
              )}
              {run.commit_sha && (
                <span className="flex items-center gap-1 font-mono">
                  <GitCommit size={12} aria-hidden="true" />
                  {run.commit_sha.slice(0, 8)}
                </span>
              )}
              {run.triggered_by_name && (
                <span className="flex items-center gap-1">
                  <User size={12} aria-hidden="true" /> {run.triggered_by_name}
                </span>
              )}
              {run.duration_formatted && (
                <span className="flex items-center gap-1">
                  <Clock size={12} aria-hidden="true" /> {run.duration_formatted}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Zap size={12} aria-hidden="true" /> {run.trigger_type_display}
              </span>
            </div>
          </div>

          <StatusBadge status={run.status} />
        </div>

        {/* Mensagem do commit (opcional) */}
        {run.commit_message && (
          <p
            className="mt-3 text-xs italic px-3 py-2 rounded-lg"
            style={{
              color: "var(--col-muted)",
              background: "var(--glass-field-bg)",
            }}
          >
            &ldquo;{run.commit_message}&rdquo;
          </p>
        )}
      </GlassCard>
    </div>
  );
}
