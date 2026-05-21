"use client";

// =============================================================================
// CaseViewMode — layout stepper (3 colunas) para visualização do caso de teste
//
// Estrutura:
//   ┌──────────────────────────────────────────────────────────────────────┐
//   │ HEADER (breadcrumb, status, prioridade, título, ações, tags)         │
//   ├────────────┬──────────────────────────────────────────┬──────────────┤
//   │ Stepper    │ Step Panel                               │ Meta Sidebar │
//   │ (passos)   │ (imagem + ação + resultado esperado)     │ (contexto)   │
//   └────────────┴──────────────────────────────────────────┴──────────────┘
//
// O modo de edição NÃO é afetado — fica em CaseEditForm. Aqui é só leitura.
// Interfaces TestCase/Attachment/Priority continuam exportadas daqui pois
// outros arquivos (CaseDetailClient, CaseEditForm) importam delas.
// =============================================================================

import { useState }                                  from "react";
import { useRouter }                                 from "next/navigation";
import { ArrowLeft, Pencil, Trash2, User as UserIcon } from "lucide-react";

import { CasePageBackground } from "@/app/dashboard/casos/_components/CaseShared";
import { SimpleDeleteModal }  from "@/app/dashboard/projetos/_components/ProjectModals";
import { CaseStepperSidebar } from "./stepper/CaseStepperSidebar";
import { CaseStepPanel }      from "./stepper/CaseStepPanel";
import { CaseMetaSidebar }    from "./stepper/CaseMetaSidebar";

// =============================================================================
// Interfaces — espelham o TestCaseSerializer do backend (consumidas em vários arquivos)
// =============================================================================

export interface Attachment {
  id:              string;
  title:           string;
  description:     string;
  attachment_type: "IMAGE" | "DOCUMENT" | "OTHER";
  file:            string | null; // null em passos só-com-descrição
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
// Tabelas de estilo (status + prioridade) — paleta alinhada ao restante do app
// =============================================================================
const STATUS_STYLES: Record<TestCase["status"], { label: string; bg: string; color: string; dot: string }> = {
  DRAFT:      { label: "Rascunho",  bg: "rgba(254,243,199,0.6)", color: "#92400E", dot: "#F59E0B" },
  ACTIVE:     { label: "Ativo",      bg: "rgba(209,250,229,0.6)", color: "#065F46", dot: "#10B981" },
  DEPRECATED: { label: "Depreciado", bg: "rgba(254,226,226,0.6)", color: "#991B1B", dot: "#EF4444" },
};

const PRIORITY_STYLES: Record<Priority, { label: string; bg: string; color: string; dot: string }> = {
  CRITICAL: { label: "Crítica", bg: "rgba(254,226,226,0.5)", color: "#991B1B", dot: "#DC2626" },
  HIGH:     { label: "Alta",    bg: "rgba(255,237,213,0.5)", color: "#9A3412", dot: "#EA580C" },
  MEDIUM:   { label: "Média",   bg: "rgba(219,234,254,0.5)", color: "#1D4ED8", dot: "#2563EB" },
  LOW:      { label: "Baixa",   bg: "rgba(241,245,249,0.7)", color: "#475569", dot: "#94A3B8" },
};

// Hash determinístico → cor do pill do módulo (consistente entre sessões)
function moduleHue(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h % 360;
}

// Data ISO → "dd/MM/yyyy HH:mm"
function formatDateBR(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

// =============================================================================
// Props
// =============================================================================
interface Props {
  caso:     TestCase;
  onEdit:   () => void;
  onDelete: () => Promise<void>;
  deleting: boolean;
}

// =============================================================================
// CaseViewMode
// =============================================================================
export function CaseViewMode({ caso, onEdit, onDelete, deleting }: Props) {
  const router = useRouter();

  // Passos ordenados (cópia para não mutar o array original do caso)
  const steps = [...caso.attachments].sort((a, b) => a.order - b.order);

  const [activeStep, setActiveStep] = useState(0);
  const currentStep = steps[activeStep] ?? null;

  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleConfirmDelete = async () => {
    setConfirmDelete(false);
    await onDelete();
  };

  const statusStyle = STATUS_STYLES[caso.status];
  const prioStyle   = PRIORITY_STYLES[caso.priority] ?? PRIORITY_STYLES.MEDIUM;
  const modHue      = caso.module ? moduleHue(caso.module) : null;

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <CasePageBackground />

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header className="rounded-2xl p-5"
        style={{
          background:           "var(--glass-card-bg)",
          backdropFilter:       "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border:               "1px solid var(--glass-card-border)",
          boxShadow:            "var(--glass-shadow)",
        }}>

        {/* Linha 1: voltar + breadcrumb + ações */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={() => router.push("/dashboard/casos/")}
              className="p-2 rounded-xl transition-all flex-shrink-0" style={{ color: "var(--col-dim)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(241,245,249,0.8)"; e.currentTarget.style.color = "var(--col-muted)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--col-dim)"; }}>
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              {/* Breadcrumb */}
              <p className="text-xs font-medium flex items-center gap-1.5 truncate" style={{ color: "var(--col-dim)" }}>
                <span>Casos</span>
                {caso.module && (
                  <>
                    <span>/</span>
                    {modHue !== null ? (
                      <span className="px-1.5 py-0.5 rounded-md font-semibold"
                        style={{ background: `hsl(${modHue} 85% 95%)`, color: `hsl(${modHue} 70% 30%)` }}>
                        {caso.module}
                      </span>
                    ) : (
                      <span>{caso.module}</span>
                    )}
                  </>
                )}
                <span>/</span>
                <span className="font-mono font-bold" style={{ color: "#1D4ED8" }}>{caso.case_id}</span>
              </p>

              {/* Pills (status + prioridade) + título */}
              <div className="flex items-center flex-wrap gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.dot}30` }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusStyle.dot }} />
                  {statusStyle.label}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: prioStyle.bg, color: prioStyle.color, border: `1px solid ${prioStyle.dot}30` }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: prioStyle.dot }} />
                  {prioStyle.label}
                </span>
                <h1 className="text-base font-extrabold tracking-tight truncate" style={{ color: "var(--col-heading)" }}>
                  {caso.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button type="button" onClick={() => setConfirmDelete(true)} disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ color: "#DC2626", background: "rgba(254,226,226,0.4)", border: "1px solid rgba(252,165,165,0.4)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(254,226,226,0.8)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(254,226,226,0.4)"; }}>
              <Trash2 className="h-4 w-4" />
              {deleting ? "Excluindo..." : "Excluir"}
            </button>
            <button type="button" onClick={onEdit}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg,#2563EB,#3B82F6)", boxShadow: "0 2px 10px rgba(37,99,235,0.25)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,#1D4ED8,#2563EB)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,#2563EB,#3B82F6)"; e.currentTarget.style.transform = "none"; }}>
              <Pencil className="h-4 w-4" /> Editar
            </button>
          </div>
        </div>

        {/* Linha 2: metadados (responsável, última edição, tags) */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-3 pt-3"
          style={{ borderTop: "1px solid var(--glass-inner-border)" }}>
          {/* Responsável */}
          <div className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--col-muted)" }}>
            <UserIcon className="h-3.5 w-3.5" />
            <span style={{ color: caso.assigned_to_name ? "var(--col-body)" : "var(--col-dim)" }}>
              {caso.assigned_to_name || "Sem responsável"}
            </span>
          </div>

          {/* Última edição */}
          {caso.last_modified_by_name && (
            <div className="text-xs" style={{ color: "var(--col-dim)" }}>
              Editado por <strong style={{ color: "var(--col-muted)" }}>{caso.last_modified_by_name}</strong>
              {caso.updated_at && <> · {formatDateBR(caso.updated_at)}</>}
            </div>
          )}

          {/* Tags */}
          {caso.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 ml-auto">
              {caso.tags.map(tag => (
                <span key={tag.id}
                  className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: tag.color }}>
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── CORPO (3 colunas) ────────────────────────────────────────────── */}
      <div className="grid gap-5 items-start"
        style={{ gridTemplateColumns: "260px minmax(0,1fr) 300px" }}>

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