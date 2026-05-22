"use client";

// =============================================================================
// CaseFormSidebar — painel esquerdo dos formulários de criar e editar caso.
//
// Único componente compartilhado pra evitar divergência entre as duas telas.
// O campo "Projeto" varia (Select no create, texto read-only no edit) e é
// recebido como `projectSlot` (composição em vez de configuração interna).
//
// Tipagem: aceita qualquer schema que CONTENHA pelo menos os campos do
// CaseFormBaseData (Create estende com `project`; Edit usa direto).
// =============================================================================

import type {
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  FieldErrors,
  FieldValues,
  Path,
} from "react-hook-form";

import {
  GlassCard,
  SLabel,
  FLabel,
  ErrMsg,
} from "@/app/dashboard/casos/_components/CaseShared";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  STATUS_OPTS,
  PRIORITY_OPTS,
  userLabel,
  type CaseFormBaseData,
} from "./types";

// ── Tipos auxiliares ──────────────────────────────────────────────────────

export interface FormUser {
  id:         string;
  first_name: string;
  last_name:  string;
  email:      string;
}

export interface FormTag {
  id:   string;
  name: string;
}

// O sentinela "__none__" representa "não atribuído". Radix Select não aceita
// value="", então convertemos no onValueChange.
const NO_ASSIGNEE = "__none__";

// ── Props ──────────────────────────────────────────────────────────────────

interface Props<T extends FieldValues & CaseFormBaseData> {
  // react-hook-form (passados como métodos individuais — perda zero de tipagem)
  register: UseFormRegister<T>;
  watch:    UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  errors:   FieldErrors<T>;

  // Dados externos vindos dos hooks (useCreateCase / useEditCase)
  users:        FormUser[];
  tags:         FormTag[];
  selectedTags: string[];
  onToggleTag:  (id: string) => void;

  // Slot para o campo "Projeto" — varia entre criar (select) e editar (read-only)
  projectSlot: React.ReactNode;
}

// =============================================================================
// Component
// =============================================================================
export function CaseFormSidebar<T extends FieldValues & CaseFormBaseData>({
  register,
  watch,
  setValue,
  errors,
  users,
  tags,
  selectedTags,
  onToggleTag,
  projectSlot,
}: Props<T>) {
  // Helpers tipados — assumem que T contém os campos do schema base. O cast
  // via `unknown` é necessário porque o compilador não consegue inferir que
  // `keyof CaseFormBaseData ⊂ Path<T>` (sabemos por contrato, ele não).
  const reg      = (field: keyof CaseFormBaseData) => register(field as unknown as Path<T>);
  const w        = <K extends keyof CaseFormBaseData>(field: K) => watch(field as unknown as Path<T>) as CaseFormBaseData[K];
  const setField = <K extends keyof CaseFormBaseData>(field: K, value: CaseFormBaseData[K]) =>
    setValue(field as unknown as Path<T>, value as never);

  const curStatus   = w("status");
  const curPriority = w("priority");
  const curAssigned = (w("assigned_to") ?? "") as string;

  return (
    <div className="w-[340px] flex-shrink-0 space-y-5">

      {/* ── Identificação ── */}
      <GlassCard className="p-5 space-y-4">
        <SLabel emoji="🆔">Identificação</SLabel>
        <div>
          <FLabel required>ID</FLabel>
          <input {...reg("case_id")} placeholder="TC-001"
            className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm font-mono"
            style={{ textTransform: "uppercase" }} />
          <ErrMsg msg={errors.case_id?.message as string | undefined} />
        </div>
        <div>
          <FLabel required>Título</FLabel>
          <input {...reg("title")} placeholder="Descreva o teste"
            className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm" />
          <ErrMsg msg={errors.title?.message as string | undefined} />
        </div>
      </GlassCard>

      {/* ── Classificação (Projeto + Módulo) ── */}
      <GlassCard className="p-5 space-y-4">
        <SLabel emoji="🗂️">Classificação</SLabel>
        {/* Slot — pai decide o que renderiza aqui */}
        {projectSlot}
        <div>
          <FLabel>Módulo</FLabel>
          <input {...reg("module")} placeholder="ex: Autenticação"
            className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm" />
        </div>
      </GlassCard>

      {/* ── Status ── */}
      <GlassCard className="p-5">
        <SLabel emoji="⚡">Status</SLabel>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_OPTS.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => setField("status", opt.value)}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: curStatus === opt.value ? opt.g : "rgba(248,250,252,0.6)",
                color:      curStatus === opt.value ? opt.t : "#94A3B8",
                border:     curStatus === opt.value ? `1.5px solid ${opt.b}30` : "1.5px solid rgba(226,232,240,0.5)",
                transform:  curStatus === opt.value ? "scale(1.03)" : "scale(1)",
                boxShadow:  curStatus === opt.value ? `0 2px 8px ${opt.b}20` : "none",
              }}>
              <span className="text-lg">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* ── Prioridade ── */}
      <GlassCard className="p-5">
        <SLabel emoji="🚩">Prioridade</SLabel>
        <div className="grid grid-cols-2 gap-2">
          {PRIORITY_OPTS.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => setField("priority", opt.value)}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: curPriority === opt.value ? opt.g : "rgba(248,250,252,0.6)",
                color:      curPriority === opt.value ? opt.t : "#94A3B8",
                border:     curPriority === opt.value ? `1.5px solid ${opt.b}30` : "1.5px solid rgba(226,232,240,0.5)",
                transform:  curPriority === opt.value ? "scale(1.03)" : "scale(1)",
                boxShadow:  curPriority === opt.value ? `0 2px 8px ${opt.b}20` : "none",
              }}>
              <span className="text-lg">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* ── Responsável (Radix Select; vazio = não atribuído) ── */}
      <GlassCard className="p-5">
        <SLabel emoji="👤">Responsável</SLabel>
        <Select
          value={curAssigned || NO_ASSIGNEE}
          onValueChange={(v) => setField("assigned_to", v === NO_ASSIGNEE ? "" : v)}
        >
          <SelectTrigger className="w-full" />
          <SelectContent>
            <SelectItem value={NO_ASSIGNEE}>Não atribuído</SelectItem>
            {users.map(u => (
              <SelectItem key={u.id} value={u.id}>{userLabel(u)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </GlassCard>

      {/* ── Tags ── */}
      {tags.length > 0 && (
        <GlassCard className="p-5">
          <SLabel emoji="🏷️">Tags</SLabel>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => {
              const sel = selectedTags.includes(tag.id);
              return (
                <button key={tag.id} type="button" onClick={() => onToggleTag(tag.id)}
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

      {/* ── Playwright ── */}
      <GlassCard className="p-5 space-y-3">
        <SLabel emoji="🎭">Playwright</SLabel>
        <div>
          <FLabel>ID do Teste</FLabel>
          <input {...reg("playwright_id")} placeholder="auth-login-valid"
            className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm font-mono" />
        </div>
        <div>
          <FLabel>Título no Código</FLabel>
          <input {...reg("test_title")} placeholder="deve autenticar com..."
            className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm font-mono" />
        </div>
      </GlassCard>
    </div>
  );
}
