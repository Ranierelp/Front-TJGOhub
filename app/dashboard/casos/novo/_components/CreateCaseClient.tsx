"use client";

import { useState }        from "react";
import { useForm }         from "react-hook-form";
import { zodResolver }     from "@hookform/resolvers/zod";
import { z }               from "zod";
import { useRouter }       from "next/navigation";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";

import { StepCard }                   from "./StepCard";
import { useCreateCase, PendingStep } from "@/hooks/useCreateCase";
// GlassCard, SLabel, FLabel, ErrMsg, Accordion agora vêm do arquivo compartilhado.
// Antes estavam definidos aqui mesmo — duplicados no CaseDetailClient.
import { GlassCard, SLabel, FLabel, ErrMsg, Accordion, CasePageBackground } from "@/app/dashboard/casos/_components/CaseShared";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// ── Schema ────────────────────────────────────────────────────────────────────
// assigned_to: aceita UUID (responsável escolhido) ou string vazia (sem responsável).
// Convertemos "" → null no onSubmit, pois o backend espera null para "sem responsável".
const schema = z.object({
  project:         z.string().uuid("Selecione um projeto"),
  case_id:         z.string().min(1, "Obrigatório").max(50),
  title:           z.string().min(1, "Obrigatório").max(255),
  status:          z.enum(["DRAFT", "ACTIVE", "DEPRECATED"]),
  priority:        z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  assigned_to:     z.string().optional(),
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
  { value: "DRAFT"       as const, label: "Rascunho",  emoji: "✏️", g: "linear-gradient(135deg,#FEF3C7,#FDE68A)", b: "#F59E0B", t: "#92400E" },
  { value: "ACTIVE"      as const, label: "Ativo",      emoji: "⚡", g: "linear-gradient(135deg,#D1FAE5,#A7F3D0)", b: "#10B981", t: "#065F46" },
  { value: "DEPRECATED"  as const, label: "Depreciado", emoji: "📦", g: "linear-gradient(135deg,#FEE2E2,#FECACA)", b: "#EF4444", t: "#991B1B" },
];

// Opções de prioridade — cores alinhadas com o KanbanCard (mesma paleta visual)
const PRIORITY_OPTS = [
  { value: "CRITICAL" as const, label: "Crítica", emoji: "🔥", g: "linear-gradient(135deg,#FEE2E2,#FECACA)", b: "#DC2626", t: "#991B1B" },
  { value: "HIGH"     as const, label: "Alta",    emoji: "⚡", g: "linear-gradient(135deg,#FFEDD5,#FED7AA)", b: "#EA580C", t: "#9A3412" },
  { value: "MEDIUM"   as const, label: "Média",   emoji: "●",  g: "linear-gradient(135deg,#DBEAFE,#BFDBFE)", b: "#2563EB", t: "#1D4ED8" },
  { value: "LOW"      as const, label: "Baixa",   emoji: "↓",  g: "linear-gradient(135deg,#F1F5F9,#E2E8F0)", b: "#94A3B8", t: "#475569" },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export function CreateCaseClient() {
  const router = useRouter();
  const { projects, tags, users, loading, submitting, submit } = useCreateCase();

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [steps, setSteps]               = useState<PendingStep[]>([{ description: "" }]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { status: "DRAFT", priority: "MEDIUM", assigned_to: "", project: "" },
    });

  const cur         = watch("status");
  const curPrio     = watch("priority");
  const curProject  = watch("project");
  const curAssigned = watch("assigned_to");

  const addStep    = () => setSteps(s => [...s, { description: "" }]);
  const removeStep = (i: number) => setSteps(s => s.filter((_, j) => j !== i));
  const updateStep = (i: number, step: PendingStep) => setSteps(s => s.map((v, j) => j === i ? step : v));
  const toggleTag  = (id: string) => setSelectedTags(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id]);
  // assigned_to vazio → null para o backend (campo nullable no model TestCase).
  const onSubmit   = (data: FormData) =>
    submit({
      ...data,
      case_id: data.case_id.toUpperCase(),
      assigned_to: data.assigned_to ? data.assigned_to : null,
      tag_ids: selectedTags,
    }, steps);

  // Helper: nome do usuário para exibir no <option> (cai pro email se sem nome).
  const userLabel = (u: { first_name: string; last_name: string; email: string }) => {
    const full = `${u.first_name} ${u.last_name}`.trim();
    return full || u.email;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#3B82F6" }} />
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <CasePageBackground />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.back()}
              className="p-2 rounded-xl transition-all"
              style={{ color: "#94A3B8" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(241,245,249,0.8)"; e.currentTarget.style.color = "#475569"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; }}>
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--col-dim)" }}>Caso de Teste</p>
              <h1 className="text-sm font-bold" style={{ color: "var(--col-heading)" }}>Cadastro / Edição</h1>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={() => router.back()}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ color: "#64748B", background: "rgba(241,245,249,0.6)", border: "1px solid rgba(226,232,240,0.5)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(241,245,249,1)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(241,245,249,0.6)"; }}>
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

            {/* Identificação */}
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

            {/* Classificação */}
            <GlassCard className="p-5 space-y-4">
              <SLabel emoji="🗂️">Classificação</SLabel>
              <div>
                <FLabel required>Projeto</FLabel>
                <Select
                  value={curProject || ""}
                  onValueChange={(v) => setValue("project", v, { shouldValidate: true })}
                >
                  <SelectTrigger className="w-full" placeholder="Selecione..." />
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ErrMsg msg={errors.project?.message} />
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

            {/* Prioridade — 4 botões em grid 2x2, mesmo padrão visual de Status */}
            <GlassCard className="p-5">
              <SLabel emoji="🚩">Prioridade</SLabel>
              <div className="grid grid-cols-2 gap-2">
                {PRIORITY_OPTS.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setValue("priority", opt.value)}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: curPrio === opt.value ? opt.g : "rgba(248,250,252,0.6)",
                      color:      curPrio === opt.value ? opt.t : "#94A3B8",
                      border:     curPrio === opt.value ? `1.5px solid ${opt.b}30` : "1.5px solid rgba(226,232,240,0.5)",
                      transform:  curPrio === opt.value ? "scale(1.03)" : "scale(1)",
                      boxShadow:  curPrio === opt.value ? `0 2px 8px ${opt.b}20` : "none",
                    }}>
                    <span className="text-lg">{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Responsável — vazio = sem responsável (null no backend).
                Radix Select não aceita value="", então usamos "__none__" como
                sentinel e convertemos no onValueChange. */}
            <GlassCard className="p-5">
              <SLabel emoji="👤">Responsável</SLabel>
              <Select
                value={curAssigned || "__none__"}
                onValueChange={(v) => setValue("assigned_to", v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="w-full" />
                <SelectContent>
                  <SelectItem value="__none__">Não atribuído</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{userLabel(u)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  {steps.length}
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

            {steps.map((step, i) => (
              <StepCard key={i} step={step} index={i} onUpdate={updateStep} onRemove={removeStep} />
            ))}

            {/* Seções colapsáveis */}
            <div className="space-y-3 pt-2">
              <Accordion title="Resultado Esperado" emoji="✅">
                <textarea {...register("expected_result")} placeholder="Descreva o resultado esperado..." rows={4}
                  className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm resize-none" style={{ lineHeight: "1.7" }} />
              </Accordion>
              <Accordion title="Observações" emoji="📝">
                <textarea {...register("observations")} placeholder="Adicione observações ou notas..." rows={4}
                  className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm resize-none" style={{ lineHeight: "1.7" }} />
              </Accordion>
              <Accordion title="Objetivo / Pré-condições / Pós-condições" emoji="🎯">
                <div className="space-y-3">
                  <textarea {...register("objective")}     placeholder="Objetivo do teste..."          rows={2} className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm resize-none" style={{ lineHeight: "1.6" }} />
                  <textarea {...register("preconditions")} placeholder="Pré-condições necessárias..."  rows={2} className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm resize-none" style={{ lineHeight: "1.6" }} />
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
