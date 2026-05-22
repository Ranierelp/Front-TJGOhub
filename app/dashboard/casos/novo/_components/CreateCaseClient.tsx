"use client";

import { useState }    from "react";
import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z }           from "zod";
import { useRouter }   from "next/navigation";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";

import { StepCard }                   from "./StepCard";
import { useCreateCase, PendingStep } from "@/hooks/useCreateCase";
import { FLabel, ErrMsg, CasePageBackground } from "@/app/dashboard/casos/_components/CaseShared";
import { CaseFormSidebar }    from "@/app/dashboard/casos/_components/form/CaseFormSidebar";
import { CaseFormAccordions } from "@/app/dashboard/casos/_components/form/CaseFormAccordions";
import { caseFormBaseSchema } from "@/app/dashboard/casos/_components/form/types";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Schema do create = base + project (obrigatório só na criação)
const schema = caseFormBaseSchema.extend({
  project: z.string().uuid("Selecione um projeto"),
});
type FormData = z.infer<typeof schema>;

export function CreateCaseClient() {
  const router = useRouter();
  const { projects, tags, users, loading, submitting, submit } = useCreateCase();

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [steps,        setSteps]        = useState<PendingStep[]>([{ description: "" }]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { status: "DRAFT", priority: "MEDIUM", assigned_to: "", project: "" },
    });

  const curProject = watch("project");

  const addStep    = () => setSteps(s => [...s, { description: "" }]);
  const removeStep = (i: number) => setSteps(s => s.filter((_, j) => j !== i));
  const updateStep = (i: number, step: PendingStep) => setSteps(s => s.map((v, j) => j === i ? step : v));
  const toggleTag  = (id: string) => setSelectedTags(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id]);

  // assigned_to vazio → null (campo nullable no model TestCase)
  const onSubmit = (data: FormData) =>
    submit({
      ...data,
      case_id: data.case_id.toUpperCase(),
      assigned_to: data.assigned_to ? data.assigned_to : null,
      tag_ids: selectedTags,
    }, steps);

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

        {/* Dois painéis: esquerdo compartilhado (CaseFormSidebar) + direito (passos + accordions) */}
        <div className="flex gap-6 items-start">

          {/* Painel esquerdo — vem do componente compartilhado */}
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
            }
          />

          {/* Painel direito — passos (específicos do criar) + accordions compartilhados */}
          <div className="flex-1 space-y-5 min-w-0">
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

            <CaseFormAccordions register={register} />
          </div>
        </div>
      </form>
    </div>
  );
}
