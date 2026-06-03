"use client";

// =============================================================================
// CaseViewMode — visualização do caso de teste (layout stepper 3 colunas)
//
// Estrutura:
//   ┌────────────────────────────────────────────────────────────────────────┐
//   │ HEADER (breadcrumb fino + ID/status/prioridade/título/responsável/data│
//   │         + Excluir + Editar)                                            │
//   ├────────────────────────────────────────────────────────────────────────┤
//   │ TAGS ROW (label "TAGS" + chips mono uppercase)                         │
//   ├──────────┬────────────────────────────────────────┬────────────────────┤
//   │ 260px    │ flex-1                                  │ 300px              │
//   │ Stepper  │ Passo ativo (progresso + ação + esp.)  │ Metadados          │
//   └──────────┴────────────────────────────────────────┴────────────────────┘
//
// Mantém as interfaces TestCase/Attachment/Priority exportadas (outros arquivos
// importam delas). O modo de edição NÃO é afetado — fica no CaseEditForm.
// =============================================================================

import { useState }                                  from "react";
import { useRouter }                                 from "next/navigation";
import { Pencil, Trash2 }                            from "lucide-react";

import { SimpleDeleteModal }  from "@/app/dashboard/projetos/_components/ProjectModals";
import { CaseStepperSidebar } from "./stepper/CaseStepperSidebar";
import { CaseStepPanel }      from "./stepper/CaseStepPanel";
import { CaseMetaSidebar }    from "./stepper/CaseMetaSidebar";

// =============================================================================
// Interfaces — espelham o TestCaseSerializer do backend
// =============================================================================

export interface Attachment {
  id:              string;
  title:           string;
  description:     string;
  attachment_type: "IMAGE" | "DOCUMENT" | "OTHER";
  file:            string | null;
  order:           number;
}

export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface TestCase {
  id:                    string;
  case_id:               string;
  title:                 string;
  status:                "ACTIVE" | "DRAFT" | "DEPRECATED";
  priority:              Priority;
  priority_display:      string;
  assigned_to:           string | null;
  assigned_to_name:      string | null;
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

// =============================================================================
// Helpers
// =============================================================================

// Status: dot + label compatíveis com as 3 opções do backend
const STATUS_META: Record<TestCase["status"], { label: string; dot: string; bg: string; fg: string }> = {
  ACTIVE:     { label: "Ativo",      dot: "var(--success-fg)", bg: "var(--success-bg)", fg: "var(--success-fg)" },
  DRAFT:      { label: "Rascunho",   dot: "var(--warning-fg)", bg: "var(--warning-bg)", fg: "var(--warning-fg)" },
  DEPRECATED: { label: "Depreciado", dot: "var(--danger-fg)",  bg: "var(--danger-bg)",  fg: "var(--danger-fg)"  },
};

const PRIORITY_STYLE: Record<Priority, { label: string; bg: string; fg: string }> = {
  CRITICAL: { label: "Crítica", bg: "var(--critical-bg)", fg: "var(--critical-fg)" },
  HIGH:     { label: "Alta",    bg: "var(--high-bg)",     fg: "var(--high-fg)"     },
  MEDIUM:   { label: "Média",   bg: "var(--medium-bg)",   fg: "var(--medium-fg)"   },
  LOW:      { label: "Baixa",   bg: "var(--low-bg)",      fg: "var(--low-fg)"      },
};

// Hash determinístico nome → cor para o módulo (consistente entre sessões)
function moduleColor(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 65% 45%)`;
}

// Hash determinístico para a cor do avatar (igual ao do módulo, paleta diferente)
function avatarColor(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 17 + text.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 55% 40%)`;
}

// "Raniere Luiz Pereira Neto" → "RP" (primeira + última inicial)
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Data ISO → "13 mai 2026, 09:42"
function formatDateBR(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
            .replace(".", "");
  } catch {
    return iso;
  }
}

// =============================================================================
// Component
// =============================================================================
interface Props {
  caso:     TestCase;
  onEdit:   () => void;
  onDelete: () => Promise<void>;
  deleting: boolean;
}

export function CaseViewMode({ caso, onEdit, onDelete, deleting }: Props) {
  const router = useRouter();

  const steps        = [...caso.attachments].sort((a, b) => a.order - b.order);
  const [activeStep, setActiveStep] = useState(0);
  const currentStep  = steps[activeStep] ?? null;

  const [confirmDelete, setConfirmDelete] = useState(false);
  const handleConfirmDelete = async () => {
    setConfirmDelete(false);
    await onDelete();
  };

  const status      = STATUS_META[caso.status];
  const priority    = PRIORITY_STYLE[caso.priority];
  const modColor    = caso.module ? moduleColor(caso.module) : null;
  const responsavel = caso.assigned_to_name || "";

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden"
      style={{ background: "var(--page-bg)", color: "var(--col-heading)", fontFamily: "'DM Sans',system-ui,sans-serif" }}
    >
      {/* ===================== HEADER ===================== */}
      <header
        className="px-8 pb-4 pt-[18px]"
        style={{ background: "var(--glass-card-bg)", borderBottom: "1px solid var(--glass-card-border)" }}
      >
        {/* Breadcrumb */}
        <div className="mb-2 flex items-center gap-2.5 text-xs" style={{ color: "var(--col-dim)" }}>
          <button
            type="button"
            onClick={() => router.push("/dashboard/casos/board")}
            className="font-semibold hover:underline"
          >
            ← Voltar ao board
          </button>
          {caso.project_name && (
            <>
              <span style={{ color: "var(--col-divider)" }}>/</span>
              <span className="font-semibold">{caso.project_name}</span>
            </>
          )}
          {caso.module && modColor && (
            <>
              <span style={{ color: "var(--col-divider)" }}>/</span>
              <span
                className="rounded px-2 py-[2px] font-mono text-[10px] font-extrabold uppercase tracking-wider"
                style={{ background: `${modColor}1f`, color: modColor }}
              >
                {caso.module}
              </span>
            </>
          )}
        </div>

        {/* Identidade do caso */}
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            {/* Pílulas: ID + status + prioridade */}
            <div className="mb-1.5 flex items-baseline flex-wrap gap-2.5">
              <span
                className="rounded px-2 py-[2px] font-mono text-[13px] font-bold tracking-wider"
                style={{ background: "var(--brand-bg)", color: "var(--brand-fg)" }}
              >
                {caso.case_id}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-[2px] text-[10.5px] font-semibold"
                style={{ background: status.bg, color: status.fg }}
              >
                <span className="h-[5px] w-[5px] rounded-full" style={{ background: status.dot }} />
                {status.label}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-bold"
                style={{ background: priority.bg, color: priority.fg }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
                {priority.label}
              </span>
            </div>

            {/* Título */}
            <h1 className="text-[22px] font-extrabold leading-snug tracking-tight [text-wrap:pretty]">
              {caso.title}
            </h1>

            {/* Meta-row: Responsável | Atualizado */}
            <div className="mt-2.5 flex items-center flex-wrap gap-4 text-[11.5px]" style={{ color: "var(--col-dim)" }}>
              {/* Responsável */}
              <div className="inline-flex items-center gap-2">
                {responsavel ? (
                  <span
                    className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ background: avatarColor(responsavel) }}
                    title={responsavel}
                  >
                    {initialsOf(responsavel)}
                  </span>
                ) : (
                  <span
                    className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9px] font-bold"
                    style={{ background: "var(--glass-inner-border)", color: "var(--col-dim)" }}
                  >
                    ?
                  </span>
                )}
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--col-faint)" }}>
                    Responsável
                  </span>
                  <span className="font-semibold" style={{ color: responsavel ? "var(--col-muted)" : "var(--col-dim)" }}>
                    {responsavel || "Sem responsável"}
                  </span>
                </div>
              </div>

              {/* Divisor vertical */}
              <div className="h-[26px] w-px" style={{ background: "var(--col-divider)" }} />

              {/* Atualizado */}
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--col-faint)" }}>
                  Atualizado
                </span>
                <span className="font-mono text-[11.5px] font-semibold" style={{ color: "var(--col-muted)" }}>
                  {caso.updated_at ? formatDateBR(caso.updated_at) : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Ações: Excluir + Editar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition-colors"
              style={{
                color: "var(--danger-fg)",
                background: "color-mix(in oklab, var(--danger-fg) 10%, transparent)",
                border: "1px solid color-mix(in oklab, var(--danger-fg) 25%, transparent)",
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Excluindo..." : "Excluir"}
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-white"
              style={{ background: "var(--brand-solid)" }}
            >
              <Pencil className="h-3.5 w-3.5" /> Editar
            </button>
          </div>
        </div>
      </header>

      {/* ===================== TAGS ROW ===================== */}
      {caso.tags.length > 0 && (
        <div
          className="flex items-center gap-2 px-8 py-2.5"
          style={{ background: "var(--glass-card-bg)", borderBottom: "1px solid var(--glass-card-border)" }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--col-faint)" }}>
            Tags
          </span>
          <div className="flex flex-wrap gap-1.5">
            {caso.tags.map(tag => (
              <span
                key={tag.id}
                className="rounded border px-1.5 py-[2px] font-mono text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  // Fundo sutil com a cor da tag, borda média e texto na cor cheia
                  // — preserva a estética mono/uppercase do design e ainda destaca a cor.
                  background:  `${tag.color}1f`,  // ~12% alpha
                  borderColor: `${tag.color}55`,  // ~33% alpha
                  color:       tag.color,
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ===================== MAIN 3-COL GRID ===================== */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[260px_1fr_300px]">
        <CaseStepperSidebar
          steps={steps}
          activeStep={activeStep}
          onSelect={setActiveStep}
        />

        <CaseStepPanel
          step={currentStep}
          index={activeStep}
          total={steps.length}
          expectedResult={caso.expected_result}
          onPrev={() => setActiveStep(i => Math.max(0, i - 1))}
          onNext={() => setActiveStep(i => Math.min(steps.length - 1, i + 1))}
          canPrev={activeStep > 0}
          canNext={activeStep < steps.length - 1}
        />

        <CaseMetaSidebar caso={caso} />
      </div>

      {confirmDelete && (
        <SimpleDeleteModal
          title="Excluir Caso de Teste?"
          description={`${caso.case_id} — ${caso.title}`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
