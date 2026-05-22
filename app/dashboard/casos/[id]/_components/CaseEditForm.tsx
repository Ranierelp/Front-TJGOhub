"use client";

import { useState, useRef } from "react";
import { useForm }          from "react-hook-form";
import Zoom                 from "react-medium-image-zoom";
// @ts-ignore — CSS side-effect import sem tipos (tolerado pelo build)
import "react-medium-image-zoom/dist/styles.css";
import { zodResolver }      from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Loader2, X, ImagePlus } from "lucide-react";

import { StepCard }                   from "@/app/dashboard/casos/novo/_components/StepCard";
import { useEditCase }                from "@/hooks/useEditCase";
import { GlassCard, FLabel }          from "@/app/dashboard/casos/_components/CaseShared";
import { CaseFormSidebar }            from "@/app/dashboard/casos/_components/form/CaseFormSidebar";
import { CaseFormAccordions }         from "@/app/dashboard/casos/_components/form/CaseFormAccordions";
import { caseFormBaseSchema, type CaseFormBaseData } from "@/app/dashboard/casos/_components/form/types";
import type { PendingStep }           from "@/hooks/useCreateCase";
import type { TestCase, Attachment }  from "./CaseViewMode";

// Estende Attachment com campos de edição local (não persistidos até Salvar)
interface EditableAttachment extends Attachment {
  newImage?:   File;    // nova imagem selecionada pelo usuário
  newPreview?: string;  // preview base64 gerado pelo FileReader
}

// O schema do edit é igual ao base (sem `project` — não é editável)
type FormData = CaseFormBaseData;

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

  // Prioridade: preview da nova imagem selecionada → imagem salva no servidor.
  // `attachment.file` pode ser null em passos só-com-descrição.
  const imgSrc = attachment.newPreview
    ?? attachment.file?.replace(/^https?:\/\/[^/]+/, "")
    ?? "";

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
          Passo {index + 1}
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
              <div
                className="rounded-xl p-7 text-center cursor-pointer transition-all"
                style={{ border: "2px dashed var(--glass-inner-border)", background: "var(--glass-field-bg)" }}
                onClick={() => inputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={e => e.preventDefault()}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)"; e.currentTarget.style.background = "rgba(239,246,255,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-inner-border)"; e.currentTarget.style.background = "var(--glass-field-bg)"; }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "linear-gradient(135deg,rgba(219,234,254,0.8),rgba(191,219,254,0.5))", color: "#3B82F6", border: "1px solid rgba(147,197,253,0.3)" }}>
                  <ImagePlus className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--col-muted)" }}>
                  Arraste imagens aqui ou{" "}
                  <span className="font-bold" style={{ color: "#2563EB" }}>clique para selecionar</span>
                </p>
                <p className="text-xs mt-1.5" style={{ color: "var(--col-dim)" }}>PNG, JPG, GIF • até 5MB</p>
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
  onSaved:   (updated: TestCase) => void;
}

// =============================================================================
// CaseEditForm
// =============================================================================
export function CaseEditForm({ caso, onCancel, onSaved }: Props) {
  const { tags, users, loading, submitting, update, removeAttachment, updateAttachment } = useEditCase(caso.id);

  const [existingSteps, setExistingSteps] = useState<EditableAttachment[]>(
    [...caso.attachments].sort((a, b) => a.order - b.order)
  );
  const [newSteps,     setNewSteps]     = useState<PendingStep[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(caso.tags.map(t => t.id));
  const [removingId,   setRemovingId]   = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(caseFormBaseSchema),
      defaultValues: {
        case_id:         caso.case_id,
        title:           caso.title,
        status:          caso.status,
        priority:        caso.priority      || "MEDIUM",
        assigned_to:     caso.assigned_to   || "",
        module:          caso.module        || "",
        expected_result: caso.expected_result || "",
        observations:    caso.observations  || "",
        objective:       caso.objective     || "",
        preconditions:   caso.preconditions || "",
        postconditions:  caso.postconditions|| "",
        playwright_id:   caso.playwright_id || "",
        test_title:      caso.test_title    || "",
      },
    });

  const addStep    = () => setNewSteps(s => [...s, { description: "" }]);
  const removeNew  = (i: number) => setNewSteps(s => s.filter((_, j) => j !== i));
  const updateNew  = (i: number, step: PendingStep) => setNewSteps(s => s.map((v, j) => j === i ? step : v));
  const toggleTag  = (id: string) => setSelectedTags(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id]);

  const updateExisting = (id: string, updated: EditableAttachment) =>
    setExistingSteps(s => s.map(a => a.id === id ? updated : a));

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
      // Persiste alterações nos passos existentes (descrição e/ou nova imagem).
      const originalById = new Map(caso.attachments.map(a => [a.id, a]));
      for (const att of existingSteps) {
        const orig = originalById.get(att.id);
        const descChanged = orig && orig.description !== att.description;
        if (descChanged || att.newImage) {
          await updateAttachment(att.id, att.description, att.newImage);
        }
      }

      // assigned_to vazio → null (campo nullable no backend)
      await update(
        {
          ...data,
          case_id: data.case_id.toUpperCase(),
          assigned_to: data.assigned_to ? data.assigned_to : null,
          tag_ids: selectedTags,
        },
        newSteps,
        existingSteps.length,
      );
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

        {/* Dois painéis: esquerdo compartilhado + direito (passos + accordions) */}
        <div className="flex gap-6 items-start">

          {/* Painel esquerdo — compartilhado com o Create */}
          <CaseFormSidebar
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
            users={users}
            tags={tags}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            projectSlot={
              <div>
                <FLabel>Projeto</FLabel>
                {/* Projeto não é editável após criação — mostrado como texto */}
                <p className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm"
                  style={{ color: "var(--col-dim)", cursor: "not-allowed" }}>
                  {caso.project_name}
                </p>
              </div>
            }
          />

          {/* Painel direito — passos (existentes + novos) + accordions */}
          <div className="flex-1 space-y-5 min-w-0">

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

            <CaseFormAccordions register={register} defaultOpen />
          </div>
        </div>
      </form>
    </div>
  );
}
