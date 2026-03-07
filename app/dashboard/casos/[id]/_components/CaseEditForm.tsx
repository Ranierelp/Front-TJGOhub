"use client";

import { useState, useRef } from "react";
import { useForm }          from "react-hook-form";
import Zoom                 from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { zodResolver }      from "@hookform/resolvers/zod";
import { z }                from "zod";
import { ArrowLeft, Plus, Loader2, X, ImagePlus } from "lucide-react";

import { StepCard }                   from "@/app/dashboard/casos/novo/_components/StepCard";
import { useEditCase }                from "@/hooks/useEditCase";
import { GlassCard, SLabel, FLabel, ErrMsg, Accordion } from "@/app/dashboard/casos/_components/CaseShared";
import type { PendingStep }           from "@/hooks/useCreateCase";
import type { TestCase, Attachment }  from "./CaseViewMode";

// Estende Attachment com campos de edição local (não persistidos até Salvar)
interface EditableAttachment extends Attachment {
  newImage?:   File;    // nova imagem selecionada pelo usuário
  newPreview?: string;  // preview base64 gerado pelo FileReader
}

// =============================================================================
// Schema — mesmo do CreateCaseClient, sem o campo `project` (não é editável)
// =============================================================================
const schema = z.object({
  case_id:         z.string().min(1, "Obrigatório").max(50),
  title:           z.string().min(1, "Obrigatório").max(255),
  status:          z.enum(["DRAFT", "ACTIVE", "DEPRECATED"]),
  module:          z.string().max(100).optional(),
  expected_result: z.string().optional(),
  observations:    z.string().optional(),
  objective:       z.string().optional(),
  preconditions:   z.string().optional(),
  postconditions:  z.string().optional(),
  playwright_id:   z.string().max(255).optional(),
  test_title:      z.string().max(255).optional(),
});
type FormData = z.infer<typeof schema>;

const STATUS_OPTS = [
  { value: "DRAFT"      as const, label: "Rascunho",  emoji: "✏️", g: "linear-gradient(135deg,#FEF3C7,#FDE68A)", b: "#F59E0B", t: "#92400E" },
  { value: "ACTIVE"     as const, label: "Ativo",      emoji: "⚡", g: "linear-gradient(135deg,#D1FAE5,#A7F3D0)", b: "#10B981", t: "#065F46" },
  { value: "DEPRECATED" as const, label: "Depreciado", emoji: "📦", g: "linear-gradient(135deg,#FEE2E2,#FECACA)", b: "#EF4444", t: "#991B1B" },
];

// =============================================================================
// ExistingStepCard — card editável para passos já salvos no backend
//
// Diferenças do StepCard (criação):
//   - Começa com a imagem já carregada (URL do servidor, via proxy Next.js)
//   - Permite trocar a imagem: drag&drop ou click → gera preview base64 local
//   - Descrição editável via textarea controlado
//   - Botão X no cabeçalho remove o passo (DELETE imediato no backend)
//   - Mudanças são salvas apenas ao clicar "Salvar" no formulário
// =============================================================================
function ExistingStepCard({ attachment, index, onRemove, onChange, removing }: {
  attachment: EditableAttachment;
  index:      number;
  onRemove:   (id: string) => void;
  onChange:   (updated: EditableAttachment) => void;
  removing:   boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);

  // Prioridade: preview da nova imagem selecionada → imagem salva no servidor
  const imgSrc = attachment.newPreview
    ?? attachment.file.replace(/^https?:\/\/[^/]+/, "");

  const setImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      onChange({ ...attachment, newImage: file, newPreview: preview });
    };
    reader.readAsDataURL(file);
  };

  const clearNewImage = () => onChange({ ...attachment, newImage: undefined, newPreview: undefined });

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) setImage(file);
  };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--glass-card-bg)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        border: hovered ? "1px solid rgba(147,197,253,0.6)" : "1px solid var(--glass-card-border)",
        boxShadow: "var(--glass-shadow)",
        transition: "border-color 0.3s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      {/* Cabeçalho */}
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
        <button type="button" onClick={() => onRemove(attachment.id)} disabled={removing}
          className="p-1.5 rounded-lg transition-all"
          style={{ color: "var(--col-dim)", opacity: hovered ? 1 : 0.3, transition: "opacity 0.2s, color 0.2s, background 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.background = "rgba(254,226,226,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--col-dim)"; e.currentTarget.style.background = "transparent"; }}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Área de imagem — mostra preview novo ou imagem atual, com opção de trocar */}
        {attachment.attachment_type === "IMAGE" && (
          <div className="relative">
            {attachment.newPreview ? (
              // Nova imagem selecionada — mostra preview + botão para cancelar troca
              <>
                <Zoom>
                  <img src={attachment.newPreview} alt="Nova imagem"
                    className="w-full max-h-52 object-contain rounded-xl cursor-zoom-in"
                    style={{ border: "1px solid rgba(147,197,253,0.5)", background: "var(--glass-field-bg)" }} />
                </Zoom>
                <button type="button" onClick={clearNewImage}
                  className="absolute top-2 right-2 rounded-full p-1 transition-all"
                  style={{ background: "var(--glass-card-bg)", border: "1px solid var(--glass-inner-border)", color: "var(--col-dim)" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--col-dim)"; }}>
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : attachment.file ? (
              // Imagem atual do servidor — mostra com botão "Trocar"
              <div className="relative">
                <Zoom>
                  <img src={imgSrc} alt={attachment.title}
                    className="w-full max-h-52 object-contain rounded-xl cursor-zoom-in"
                    style={{ border: "1px solid var(--glass-inner-border)", background: "var(--glass-field-bg)" }} />
                </Zoom>
                <button type="button" onClick={() => inputRef.current?.click()}
                  className="absolute bottom-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{ background: "var(--glass-card-bg)", border: "1px solid var(--glass-inner-border)", color: "var(--col-muted)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,246,255,0.95)"; e.currentTarget.style.color = "#2563EB"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--glass-card-bg)"; e.currentTarget.style.color = "var(--col-muted)"; }}>
                  <ImagePlus className="h-3 w-3" /> Trocar
                </button>
              </div>
            ) : (
              // Sem imagem — drop zone para adicionar
              <div className="rounded-xl p-7 text-center cursor-pointer transition-all"
                style={{ border: "2px dashed var(--glass-inner-border)", background: "var(--glass-field-bg)" }}
                onClick={() => inputRef.current?.click()}
                onDrop={onDrop} onDragOver={e => e.preventDefault()}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)"; e.currentTarget.style.background = "rgba(239,246,255,0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-inner-border)"; e.currentTarget.style.background = "var(--glass-field-bg)"; }}>
                <ImagePlus className="h-5 w-5 mx-auto mb-2" style={{ color: "#3B82F6" }} />
                <p className="text-sm font-medium" style={{ color: "var(--col-muted)" }}>
                  Arraste ou <span className="font-bold" style={{ color: "#2563EB" }}>clique</span>
                </p>
              </div>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) setImage(f); }} />
          </div>
        )}

        {/* Descrição editável */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "var(--col-label)" }}>
            Descrição do Passo
          </label>
          <textarea
            value={attachment.description}
            onChange={e => onChange({ ...attachment, description: e.target.value })}
            placeholder="Descreva o que fazer neste passo..."
            rows={3}
            className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm resize-none"
            style={{ lineHeight: "1.7" }}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Props
// =============================================================================
interface Props {
  caso:      TestCase;
  onCancel:  () => void;
  onSaved:   (updated: TestCase) => void;  // chamado após salvar com sucesso
}

// =============================================================================
// CaseEditForm — formulário de edição pré-preenchido com os dados do caso
// =============================================================================
export function CaseEditForm({ caso, onCancel, onSaved }: Props) {
  const { tags, loading, submitting, update, removeAttachment, updateAttachment } = useEditCase(caso.id);

  // Passos existentes — gerenciados localmente para remoção instantânea e edição local
  const [existingSteps, setExistingSteps] = useState<EditableAttachment[]>(
    [...caso.attachments].sort((a, b) => a.order - b.order)
  );
  // Passos novos — adicionados nesta sessão de edição, enviados ao Salvar
  const [newSteps,   setNewSteps]   = useState<PendingStep[]>([]);
  // Tags selecionadas — inicializadas com as tags atuais do caso
  const [selectedTags, setSelectedTags] = useState<string[]>(caso.tags.map(t => t.id));
  const [removingId,   setRemovingId]   = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        case_id:         caso.case_id,
        title:           caso.title,
        status:          caso.status,
        module:          caso.module       || "",
        expected_result: caso.expected_result || "",
        observations:    caso.observations || "",
        objective:       caso.objective    || "",
        preconditions:   caso.preconditions  || "",
        postconditions:  caso.postconditions  || "",
        playwright_id:   caso.playwright_id  || "",
        test_title:      caso.test_title   || "",
      },
    });

  const cur = watch("status");

  const addStep    = () => setNewSteps(s => [...s, { description: "" }]);
  const removeNew  = (i: number) => setNewSteps(s => s.filter((_, j) => j !== i));
  const updateNew  = (i: number, step: PendingStep) => setNewSteps(s => s.map((v, j) => j === i ? step : v));
  const toggleTag  = (id: string) => setSelectedTags(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id]);

  // Atualiza um passo existente localmente (persiste só ao Salvar)
  const updateExisting = (id: string, updated: EditableAttachment) =>
    setExistingSteps(s => s.map(a => a.id === id ? updated : a));

  // Remove um passo existente — chama o backend imediatamente
  const handleRemoveExisting = async (attachmentId: string) => {
    setRemovingId(attachmentId);
    try {
      await removeAttachment(attachmentId);
      setExistingSteps(s => s.filter(a => a.id !== attachmentId));
    } catch {
      // erro já tratado dentro de removeAttachment (toast)
    } finally {
      setRemovingId(null);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await update(
        { ...data, case_id: data.case_id.toUpperCase(), tag_ids: selectedTags },
        newSteps,
      );
      // Reconstrói o objeto TestCase atualizado para passar ao onSaved
      // (o componente pai vai fazer um novo GET para ter os dados frescos)
      onSaved({
        ...caso,
        ...data,
        case_id: data.case_id.toUpperCase(),
        tags: caso.tags.filter(t => selectedTags.includes(t.id)),
      });
    } catch {
      // erro já tratado dentro de update (toast) — não fecha o formulário
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#3B82F6" }} />
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onCancel}
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
                Editando
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ color: "var(--col-muted)", background: "var(--glass-field-bg)", border: "1px solid var(--glass-inner-border)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(241,245,249,1)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--glass-field-bg)"; }}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg,#2563EB,#3B82F6)", boxShadow: "0 2px 10px rgba(37,99,235,0.25)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,#1D4ED8,#2563EB)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,#2563EB,#3B82F6)"; e.currentTarget.style.transform = "none"; }}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "✨"} Salvar
            </button>
          </div>
        </div>

        {/* Dois painéis */}
        <div className="flex gap-6 items-start">

          {/* PAINEL ESQUERDO */}
          <div className="w-[340px] flex-shrink-0 space-y-5">

            <GlassCard className="p-5 space-y-4">
              <SLabel emoji="🆔">Identificação</SLabel>
              <div>
                <FLabel required>ID</FLabel>
                <input {...register("case_id")} placeholder="TC-001"
                  className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm font-mono"
                  style={{ textTransform: "uppercase" }} />
                <ErrMsg msg={errors.case_id?.message} />
              </div>
              <div>
                <FLabel required>Título</FLabel>
                <input {...register("title")} placeholder="Descreva o teste"
                  className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm" />
                <ErrMsg msg={errors.title?.message} />
              </div>
            </GlassCard>

            {/* Classificação — projeto read-only (não pode mudar após criação) */}
            <GlassCard className="p-5 space-y-4">
              <SLabel emoji="🗂️">Classificação</SLabel>
              <div>
                <FLabel>Projeto</FLabel>
                {/* Projeto não é editável. Mostrar como texto evita enviar no payload. */}
                <p className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm"
                  style={{ color: "var(--col-dim)", cursor: "not-allowed" }}>
                  {caso.project_name}
                </p>
              </div>
              <div>
                <FLabel>Módulo</FLabel>
                <input {...register("module")} placeholder="ex: Autenticação"
                  className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm" />
              </div>
            </GlassCard>

            {/* Status */}
            <GlassCard className="p-5">
              <SLabel emoji="⚡">Status</SLabel>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTS.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setValue("status", opt.value)}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: cur === opt.value ? opt.g : "rgba(248,250,252,0.6)",
                      color:      cur === opt.value ? opt.t : "#94A3B8",
                      border:     cur === opt.value ? `1.5px solid ${opt.b}30` : "1.5px solid rgba(226,232,240,0.5)",
                      transform:  cur === opt.value ? "scale(1.03)" : "scale(1)",
                      boxShadow:  cur === opt.value ? `0 2px 8px ${opt.b}20` : "none",
                    }}>
                    <span className="text-lg">{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Tags */}
            {tags.length > 0 && (
              <GlassCard className="p-5">
                <SLabel emoji="🏷️">Tags</SLabel>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => {
                    const sel = selectedTags.includes(tag.id);
                    return (
                      <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                        style={sel ? {
                          background: "linear-gradient(135deg,rgba(219,234,254,0.8),rgba(191,219,254,0.5))",
                          color: "#1D4ED8", border: "1px solid rgba(147,197,253,0.5)",
                        } : {
                          border: "1.5px dashed rgba(203,213,225,0.8)",
                          color: "var(--col-dim)", background: "transparent",
                        }}>
                        {tag.name}
                        {sel && <span style={{ fontSize: 9, color: "#60A5FA" }}>✕</span>}
                      </button>
                    );
                  })}
                </div>
              </GlassCard>
            )}

            {/* Playwright */}
            <GlassCard className="p-5 space-y-3">
              <SLabel emoji="🎭">Playwright</SLabel>
              <div>
                <FLabel>ID do Teste</FLabel>
                <input {...register("playwright_id")} placeholder="auth-login-valid"
                  className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm font-mono" />
              </div>
              <div>
                <FLabel>Título no Código</FLabel>
                <input {...register("test_title")} placeholder="deve autenticar com..."
                  className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm font-mono" />
              </div>
            </GlassCard>
          </div>

          {/* PAINEL DIREITO */}
          <div className="flex-1 space-y-5 min-w-0">

            {/* Cabeçalho dos passos */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-extrabold" style={{ color: "var(--col-heading)", letterSpacing: "-0.03em" }}>
                  Passos do Teste
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#DBEAFE,#EFF6FF)", color: "#2563EB", border: "1px solid rgba(147,197,253,0.4)" }}>
                  {existingSteps.length + newSteps.length}
                </span>
              </div>
              <button type="button" onClick={addStep}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: "rgba(219,234,254,0.4)", color: "#2563EB", border: "1.5px dashed rgba(59,130,246,0.3)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(219,234,254,0.8)"; e.currentTarget.style.borderColor = "#3B82F6"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(219,234,254,0.4)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)"; }}>
                <Plus className="h-3.5 w-3.5" /> Novo Passo
              </button>
            </div>

            {/* Passos existentes (salvos no banco) */}
            {existingSteps.map((att, i) => (
              <ExistingStepCard
                key={att.id}
                attachment={att}
                index={i}
                onRemove={handleRemoveExisting}
                onChange={(updated) => updateExisting(att.id, updated)}
                removing={removingId === att.id}
              />
            ))}

            {/* Novos passos adicionados nesta sessão de edição */}
            {newSteps.map((step, i) => (
              <StepCard
                key={`new-${i}`}
                step={step}
                index={existingSteps.length + i}
                onUpdate={(globalIdx, s) => updateNew(globalIdx - existingSteps.length, s)}
                onRemove={(globalIdx) => removeNew(globalIdx - existingSteps.length)}
              />
            ))}

            {existingSteps.length === 0 && newSteps.length === 0 && (
              <GlassCard className="p-8">
                <p className="text-sm text-center" style={{ color: "var(--col-dim)" }}>
                  Nenhum passo. Clique em "Novo Passo" para adicionar.
                </p>
              </GlassCard>
            )}

            {/* Seções colapsáveis */}
            <div className="space-y-3 pt-2">
              <Accordion title="Resultado Esperado" emoji="✅" defaultOpen>
                <textarea {...register("expected_result")} placeholder="Descreva o resultado esperado..." rows={4}
                  className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm resize-none" style={{ lineHeight: "1.7" }} />
              </Accordion>
              <Accordion title="Observações" emoji="📝" defaultOpen>
                <textarea {...register("observations")} placeholder="Adicione observações ou notas..." rows={4}
                  className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm resize-none" style={{ lineHeight: "1.7" }} />
              </Accordion>
              <Accordion title="Objetivo / Pré-condições / Pós-condições" emoji="🎯" defaultOpen>
                <div className="space-y-3">
                  <textarea {...register("objective")}      placeholder="Objetivo do teste..."         rows={2} className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm resize-none" style={{ lineHeight: "1.6" }} />
                  <textarea {...register("preconditions")}  placeholder="Pré-condições necessárias..."  rows={2} className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm resize-none" style={{ lineHeight: "1.6" }} />
                  <textarea {...register("postconditions")} placeholder="Pós-condições esperadas..."   rows={2} className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm resize-none" style={{ lineHeight: "1.6" }} />
                </div>
              </Accordion>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
