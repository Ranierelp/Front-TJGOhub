"use client";

import { useRouter }                    from "next/navigation";
import { ArrowLeft, Pencil, Trash2 }    from "lucide-react";
import Zoom                             from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

import {
  GlassCard, SLabel, FLabel,
  Accordion, CasePageBackground,
} from "@/app/dashboard/casos/_components/CaseShared";

// =============================================================================
// Interfaces — espelham o TestCaseSerializer do backend
// =============================================================================

export interface Attachment {
  id:              string;
  title:           string;
  description:     string;
  attachment_type: "IMAGE" | "DOCUMENT" | "OTHER";
  file:            string;
  order:           number;
}

export interface TestCase {
  id:                    string;
  case_id:               string;
  title:                 string;
  status:                "ACTIVE" | "DRAFT" | "DEPRECATED";
  project:               string;
  project_name:          string;
  module:                string;
  objective:             string;
  preconditions:         string;
  postconditions:        string;
  expected_result:       string;
  observations:          string;
  playwright_id:         string | null;
  test_title:            string;
  tags:                  { id: string; name: string; color: string }[];
  attachments:           Attachment[];
  attachments_count:     number;
  last_modified_by_name: string | null;
  updated_at:            string;
}

const STATUS_OPTS = [
  { value: "DRAFT"      as const, label: "Rascunho",  emoji: "✏️", g: "linear-gradient(135deg,#FEF3C7,#FDE68A)", b: "#F59E0B", t: "#92400E" },
  { value: "ACTIVE"     as const, label: "Ativo",      emoji: "⚡", g: "linear-gradient(135deg,#D1FAE5,#A7F3D0)", b: "#10B981", t: "#065F46" },
  { value: "DEPRECATED" as const, label: "Depreciado", emoji: "📦", g: "linear-gradient(135deg,#FEE2E2,#FECACA)", b: "#EF4444", t: "#991B1B" },
];

// =============================================================================
// DisplayField — campo read-only com o visual dos glass-inputs
// =============================================================================
function DisplayField({ label, value, mono = false }: {
  label: string; value?: string | null; mono?: boolean;
}) {
  return (
    <div>
      <FLabel>{label}</FLabel>
      <p className={`glass-input w-full py-2.5 px-3.5 rounded-xl text-sm ${mono ? "font-mono" : ""}`}
        style={{ lineHeight: "1.6" }}>
        {value || <span style={{ color: "var(--col-dim)" }}>—</span>}
      </p>
    </div>
  );
}

// =============================================================================
// AttachmentCard — passo read-only: imagem + descrição
// =============================================================================
function AttachmentCard({ attachment, index }: { attachment: Attachment; index: number }) {
  // Extrai só o path /media/... para passar pelo proxy do Next.js.
  // Sem isso, a imagem seria carregada de localhost:8000 (origem diferente).
  const imgSrc = attachment.file.replace(/^https?:\/\/[^/]+/, "");

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background:           "var(--glass-card-bg)",
      backdropFilter:       "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      border:               "1px solid var(--glass-card-border)",
      boxShadow:            "var(--glass-shadow)",
    }}>
      <div className="flex items-center gap-3 px-5 py-3.5" style={{
        background:   "var(--glass-card-header)",
        borderBottom: "1px solid var(--glass-inner-border)",
      }}>
        <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#2563EB,#3B82F6)", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}>
          {index + 1}
        </span>
        <span className="text-sm font-bold flex-1" style={{ color: "var(--col-body)" }}>
          {attachment.title || `Passo ${index + 1}`}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {attachment.attachment_type === "IMAGE" && attachment.file && (
          <Zoom>
            <img
              src={imgSrc}
              alt={attachment.title}
              className="w-full max-h-52 object-contain rounded-xl cursor-zoom-in"
              style={{ border: "1px solid var(--glass-inner-border)", background: "var(--glass-field-bg)" }}
            />
          </Zoom>
        )}
        {attachment.description && (
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "var(--col-label)" }}>
              Descrição do Passo
            </label>
            <p className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm" style={{ lineHeight: "1.7" }}>
              {attachment.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Props
// =============================================================================
interface Props {
  caso:      TestCase;
  onEdit:    () => void;
  onDelete:  () => Promise<void>;
  deleting:  boolean;
}

// =============================================================================
// CaseViewMode — exibe os dados do caso de teste em modo leitura
// =============================================================================
export function CaseViewMode({ caso, onEdit, onDelete, deleting }: Props) {
  const router = useRouter();
  const cur    = caso.status;
  const steps  = [...caso.attachments].sort((a, b) => a.order - b.order);

  const handleDelete = async () => {
    if (!window.confirm(`Excluir o caso "${caso.case_id} - ${caso.title}"? Esta ação não pode ser desfeita.`)) return;
    await onDelete();
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <CasePageBackground />

      <div className="flex flex-col gap-6">

        {/* ── Cabeçalho ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.back()}
              className="p-2 rounded-xl transition-all" style={{ color: "var(--col-dim)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(241,245,249,0.8)"; e.currentTarget.style.color = "var(--col-muted)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--col-dim)"; }}>
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--col-dim)" }}>Caso de Teste</p>
              <h1 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--col-heading)" }}>
                <span className="font-mono px-2 py-0.5 rounded-lg text-xs"
                  style={{ background: "linear-gradient(135deg,rgba(219,234,254,0.8),rgba(191,219,254,0.5))", color: "#1D4ED8" }}>
                  {caso.case_id}
                </span>
                {caso.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button type="button" onClick={() => router.back()}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ color: "var(--col-muted)", background: "var(--glass-field-bg)", border: "1px solid var(--glass-inner-border)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(241,245,249,1)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--glass-field-bg)"; }}>
              Voltar
            </button>
            {/* Botão Excluir */}
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ color: "#DC2626", background: "rgba(254,226,226,0.4)", border: "1px solid rgba(252,165,165,0.4)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(254,226,226,0.8)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(254,226,226,0.4)"; }}>
              <Trash2 className="h-4 w-4" />
              {deleting ? "Excluindo..." : "Excluir"}
            </button>
            {/* Botão Editar */}
            <button type="button" onClick={onEdit}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg,#2563EB,#3B82F6)", boxShadow: "0 2px 10px rgba(37,99,235,0.25)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,#1D4ED8,#2563EB)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,#2563EB,#3B82F6)"; e.currentTarget.style.transform = "none"; }}>
              <Pencil className="h-4 w-4" /> Editar
            </button>
          </div>
        </div>

        {/* ── Dois painéis ── */}
        <div className="flex gap-6 items-start">

          {/* PAINEL ESQUERDO */}
          <div className="w-[340px] flex-shrink-0 space-y-5">

            <GlassCard className="p-5 space-y-4">
              <SLabel emoji="🆔">Identificação</SLabel>
              <DisplayField label="ID"     value={caso.case_id} mono />
              <DisplayField label="Título" value={caso.title}        />
            </GlassCard>

            <GlassCard className="p-5 space-y-4">
              <SLabel emoji="🗂️">Classificação</SLabel>
              <DisplayField label="Projeto" value={caso.project_name} />
              <DisplayField label="Módulo"  value={caso.module}       />
            </GlassCard>

            <GlassCard className="p-5">
              <SLabel emoji="⚡">Status</SLabel>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTS.map(opt => (
                  <div key={opt.value}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold"
                    style={{
                      background: cur === opt.value ? opt.g : "var(--glass-field-bg)",
                      color:      cur === opt.value ? opt.t : "var(--col-dim)",
                      border:     cur === opt.value ? `1.5px solid ${opt.b}30` : "1.5px solid var(--glass-inner-border)",
                      transform:  cur === opt.value ? "scale(1.03)" : "scale(1)",
                      boxShadow:  cur === opt.value ? `0 2px 8px ${opt.b}20` : "none",
                    }}>
                    <span className="text-lg">{opt.emoji}</span>
                    {opt.label}
                  </div>
                ))}
              </div>
            </GlassCard>

            {caso.tags.length > 0 && (
              <GlassCard className="p-5">
                <SLabel emoji="🏷️">Tags</SLabel>
                <div className="flex flex-wrap gap-2">
                  {caso.tags.map(tag => (
                    <span key={tag.id}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: "linear-gradient(135deg,rgba(219,234,254,0.8),rgba(191,219,254,0.5))", color: "#1D4ED8", border: "1px solid rgba(147,197,253,0.5)" }}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              </GlassCard>
            )}

            <GlassCard className="p-5 space-y-3">
              <SLabel emoji="🎭">Playwright</SLabel>
              <DisplayField label="ID do Teste"      value={caso.playwright_id} mono />
              <DisplayField label="Título no Código" value={caso.test_title}    mono />
            </GlassCard>

            {caso.last_modified_by_name && (
              <p className="text-xs px-1" style={{ color: "var(--col-dim)" }}>
                Última edição por <strong>{caso.last_modified_by_name}</strong>
              </p>
            )}
          </div>

          {/* PAINEL DIREITO */}
          <div className="flex-1 space-y-5 min-w-0">

            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-extrabold" style={{ color: "var(--col-heading)", letterSpacing: "-0.03em" }}>
                Passos do Teste
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "linear-gradient(135deg,#DBEAFE,#EFF6FF)", color: "#2563EB", border: "1px solid rgba(147,197,253,0.4)" }}>
                {steps.length}
              </span>
            </div>

            {steps.length > 0 ? (
              steps.map((att, i) => (
                <AttachmentCard key={att.id} attachment={att} index={i} />
              ))
            ) : (
              <GlassCard className="p-8">
                <p className="text-sm text-center" style={{ color: "var(--col-dim)" }}>
                  Nenhum passo cadastrado para este caso.
                </p>
              </GlassCard>
            )}

            <div className="space-y-3 pt-2">
              <Accordion title="Resultado Esperado" emoji="✅" defaultOpen>
                <p className="text-sm leading-relaxed" style={{ color: "var(--col-body)", lineHeight: "1.7" }}>
                  {caso.expected_result || <span style={{ color: "var(--col-dim)" }}>Não informado.</span>}
                </p>
              </Accordion>

              <Accordion title="Observações" emoji="📝" defaultOpen>
                <p className="text-sm leading-relaxed" style={{ color: "var(--col-body)", lineHeight: "1.7" }}>
                  {caso.observations || <span style={{ color: "var(--col-dim)" }}>Não informado.</span>}
                </p>
              </Accordion>

              <Accordion title="Objetivo / Pré-condições / Pós-condições" emoji="🎯" defaultOpen>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "var(--col-dim)" }}>Objetivo</p>
                    <p className="text-sm" style={{ color: "var(--col-body)", lineHeight: "1.6" }}>
                      {caso.objective || <span style={{ color: "var(--col-dim)" }}>Não informado.</span>}
                    </p>
                  </div>
                  <hr style={{ borderColor: "var(--glass-inner-border)" }} />
                  <div>
                    <p className="text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "var(--col-dim)" }}>Pré-condições</p>
                    <p className="text-sm" style={{ color: "var(--col-body)", lineHeight: "1.6" }}>
                      {caso.preconditions || <span style={{ color: "var(--col-dim)" }}>Não informado.</span>}
                    </p>
                  </div>
                  <hr style={{ borderColor: "var(--glass-inner-border)" }} />
                  <div>
                    <p className="text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "var(--col-dim)" }}>Pós-condições</p>
                    <p className="text-sm" style={{ color: "var(--col-body)", lineHeight: "1.6" }}>
                      {caso.postconditions || <span style={{ color: "var(--col-dim)" }}>Não informado.</span>}
                    </p>
                  </div>
                </div>
              </Accordion>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
