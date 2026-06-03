// =============================================================================
// Schema base + constantes compartilhadas entre criar e editar caso de teste.
//
// O campo `project` NÃO está no schema base — só existe na criação (no edit
// o projeto não é editável). Cada consumer estende o schema conforme precisar:
//
//   Create: caseFormBaseSchema.extend({ project: z.string().uuid(...) })
//   Edit:   caseFormBaseSchema  (usa direto)
// =============================================================================

import { z } from "zod";

export const caseFormBaseSchema = z.object({
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

export type CaseFormBaseData = z.infer<typeof caseFormBaseSchema>;

// Opções de Status — paleta visual mantida entre criar/editar
export const STATUS_OPTS = [
  { value: "DRAFT"      as const, label: "Rascunho",   emoji: "✏️", bg: "var(--warning-bg)",  border: "var(--warning-fg)",  color: "var(--warning-fg)"  },
  { value: "ACTIVE"     as const, label: "Ativo",      emoji: "⚡", bg: "var(--success-bg)",  border: "var(--success-fg)",  color: "var(--success-fg)"  },
  { value: "DEPRECATED" as const, label: "Depreciado", emoji: "📦", bg: "var(--danger-bg)",   border: "var(--danger-fg)",   color: "var(--danger-fg)"   },
];

// Opções de Prioridade — alinhada com a paleta do KanbanCard
export const PRIORITY_OPTS = [
  { value: "CRITICAL" as const, label: "Crítica", emoji: "🔥", bg: "var(--critical-bg)", border: "var(--critical-fg)", color: "var(--critical-fg)" },
  { value: "HIGH"     as const, label: "Alta",    emoji: "⚡", bg: "var(--high-bg)",     border: "var(--high-fg)",     color: "var(--high-fg)"     },
  { value: "MEDIUM"   as const, label: "Média",   emoji: "●",  bg: "var(--medium-bg)",   border: "var(--medium-fg)",   color: "var(--medium-fg)"   },
  { value: "LOW"      as const, label: "Baixa",   emoji: "↓",  bg: "var(--low-bg)",      border: "var(--low-fg)",      color: "var(--low-fg)"      },
];

// Nome amigável do usuário pra mostrar no select de Responsável
// (cai pro email se não tiver first/last)
export function userLabel(u: { first_name: string; last_name: string; email: string }): string {
  const full = `${u.first_name} ${u.last_name}`.trim();
  return full || u.email;
}