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
import { SearchableSelect } from "@/components/ui/searchable-select";

import { TagSelector } from "./TagSelector";
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
  id:    string;
  name:  string;
  color: string;
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
  onCreateTag:  (name: string, color: string) => Promise<FormTag>;

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
  onCreateTag,
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

  const assigneeOptions = [
    { value: NO_ASSIGNEE, label: "Não atribuído" },
    ...users.map(u => ({ value: u.id, label: userLabel(u) })),
  ];

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
                background: curStatus === opt.value ? opt.bg    : "var(--glass-field-bg)",
                color:      curStatus === opt.value ? opt.color : "var(--col-dim)",
                border:     curStatus === opt.value ? `1.5px solid ${opt.border}` : "1.5px solid var(--glass-inner-border)",
                transform:  curStatus === opt.value ? "scale(1.03)" : "scale(1)",
                boxShadow:  "none",
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
                background: curPriority === opt.value ? opt.bg    : "var(--glass-field-bg)",
                color:      curPriority === opt.value ? opt.color : "var(--col-dim)",
                border:     curPriority === opt.value ? `1.5px solid ${opt.border}` : "1.5px solid var(--glass-inner-border)",
                transform:  curPriority === opt.value ? "scale(1.03)" : "scale(1)",
                boxShadow:  "none",
              }}>
              <span className="text-lg">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* ── Responsável (SearchableSelect; vazio = não atribuído) ── */}
      <GlassCard className="p-5">
        <SLabel emoji="👤">Responsável</SLabel>
        <SearchableSelect
          value={curAssigned || NO_ASSIGNEE}
          onValueChange={(v) => setField("assigned_to", v === NO_ASSIGNEE ? "" : v)}
          options={assigneeOptions}
          searchPlaceholder="Buscar responsável..."
          emptyMessage="Nenhum usuário encontrado"
          triggerClassName="w-full"
          contentWidth={300}
        />
      </GlassCard>

      {/* ── Tags ── */}
      <GlassCard className="p-5">
        <SLabel emoji="🏷️">Tags</SLabel>
        <TagSelector
          tags={tags}
          selectedTags={selectedTags}
          onToggleTag={onToggleTag}
          onCreateTag={onCreateTag}
        />
      </GlassCard>

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
