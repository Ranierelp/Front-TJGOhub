"use client";

// =============================================================================
// Formulário compartilhado de criação/edição de projeto
//
// Recebe `mode` ("create" | "edit") e `initialData` para pré-preenchimento.
// O componente pai controla o submit e o cancelamento.
// =============================================================================

import { useState } from "react";
import { ArrowLeft, Link2, AlertTriangle, CheckCircle2, Loader2, Archive } from "lucide-react";
import { GlassBackground, GlassCard } from "./GlassBackground";

// Gera slug legível: "Meu Projeto" → "meu-projeto"
function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

interface Props {
  mode: "create" | "edit";
  initialData?: { name: string; description: string; slug: string };
  onSubmit: (data: { name: string; description: string }) => Promise<void>;
  onCancel: () => void;
  // Opcional — só aparece na tela de edição; o pai controla o modal de confirmação
  onArchive?: () => void;
}

export function ProjectFormClient({ mode, initialData, onSubmit, onCancel, onArchive }: Props) {
  const [name, setName]           = useState(initialData?.name ?? "");
  const [description, setDesc]    = useState(initialData?.description ?? "");
  const [submitting, setSubmitting] = useState(false);

  // No modo edição o slug não é recalculado — usa o original do backend
  const previewSlug = mode === "edit" ? initialData?.slug : slugify(name);

  const isValid = name.trim().length >= 3;
  const nameError = name.length > 0 && name.trim().length < 3;
  const charCount = description.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    await onSubmit({ name: name.trim(), description }).finally(() => setSubmitting(false));
  }

  const title = mode === "create" ? "Novo Projeto" : "Editar Projeto";

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <GlassBackground />
      <div className="max-w-3xl mx-auto flex flex-col gap-5 animate-slide-up">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--col-dim)" }}>📁 Projetos</p>
            <h1 className="text-xl font-extrabold" style={{ color: "var(--col-heading)", letterSpacing: "-0.03em" }}>
              {title}
            </h1>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ border: "1px solid var(--glass-inner-border)", color: "var(--col-muted)", background: "transparent" }}>
              <ArrowLeft size={14} /> Cancelar
            </button>
            {/* Botão arquivar — só aparece na tela de edição */}
            {onArchive && (
              <button type="button" onClick={onArchive}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ border: "1px solid rgba(245,158,11,0.4)", color: "#F59E0B", background: "rgba(254,243,199,0.4)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(254,243,199,0.7)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(254,243,199,0.4)"; }}>
                <Archive size={14} /> Arquivar
              </button>
            )}
            <button type="submit" form="project-form" disabled={!isValid || submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                background: isValid ? "linear-gradient(135deg,#2563EB,#3B82F6)" : "var(--glass-inner-border)",
                opacity: isValid ? 1 : 0.5, cursor: isValid ? "pointer" : "not-allowed",
                boxShadow: isValid ? "0 2px 10px rgba(37,99,235,0.25)" : "none",
                pointerEvents: isValid ? "auto" : "none",
              }}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              Salvar
            </button>
          </div>
        </div>

        <form id="project-form" onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Card principal */}
          <GlassCard className="p-6 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#3B82F6" }}>📝 Informações do Projeto</h2>

            {/* Nome */}
            <div>
              <label className="text-xs font-semibold flex items-center gap-1 mb-2" style={{ color: "var(--col-label)" }}>
                Nome <span style={{ color: "#2563EB" }}>*</span>
              </label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Sistema de Cadastro"
                className="glass-input w-full px-4 py-3 rounded-xl text-sm" />
              {nameError && (
                <p className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: "#EF4444" }}>
                  <AlertTriangle size={12} /> Mínimo de 3 caracteres
                </p>
              )}
              {isValid && (
                <p className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: "#10B981" }}>
                  <CheckCircle2 size={12} /> Válido
                </p>
              )}
            </div>

            {/* Preview do slug */}
            {(previewSlug || mode === "edit") && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "linear-gradient(135deg,rgba(219,234,254,0.5),rgba(239,246,255,0.4))", border: "1px solid rgba(147,197,253,0.3)" }}>
                <Link2 size={14} style={{ color: "#2563EB", flexShrink: 0 }} />
                <div>
                  <p className="text-xs" style={{ color: "var(--col-dim)" }}>Slug gerado:</p>
                  <p className="text-sm font-bold font-mono" style={{ color: "#1D4ED8" }}>/{previewSlug || "…"}</p>
                </div>
              </div>
            )}

            {/* Descrição */}
            <div>
              <label className="text-xs font-semibold flex justify-between mb-2">
                <span style={{ color: "var(--col-label)" }}>Descrição <span style={{ color: "var(--col-dim)" }}>(opcional)</span></span>
                <span style={{ color: charCount > 450 ? "#F59E0B" : "var(--col-dim)" }}>{charCount}/500</span>
              </label>
              <textarea value={description} onChange={(e) => setDesc(e.target.value.slice(0, 500))}
                rows={5} placeholder="Descreva o objetivo e escopo do projeto..."
                className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-none" />
            </div>
          </GlassCard>

          {/* Preview do card */}
          <GlassCard className="p-6">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#3B82F6" }}>👁️ Preview do Card</h2>
            <div className="rounded-xl p-4 space-y-3"
              style={{ background: "var(--glass-field-bg)", border: "1px solid var(--glass-inner-border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: "linear-gradient(135deg,rgba(219,234,254,0.8),rgba(191,219,254,0.5))" }}>📂</div>
                <div>
                  <p className="text-sm font-bold" style={{ color: name ? "var(--col-heading)" : "var(--col-dim)" }}>
                    {name || "Nome do projeto"}
                  </p>
                  <p className="text-xs font-mono" style={{ color: "var(--col-dim)" }}>
                    /{previewSlug || "slug-do-projeto"}
                  </p>
                </div>
              </div>
              {description && (
                <p className="text-xs leading-relaxed" style={{ color: "var(--col-muted)" }}>
                  {description.slice(0, 120)}{description.length > 120 ? "…" : ""}
                </p>
              )}
            </div>
          </GlassCard>
        </form>
      </div>
    </div>
  );
}
