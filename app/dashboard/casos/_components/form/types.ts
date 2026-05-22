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
  { value: "DRAFT"      as const, label: "Rascunho",   emoji: "✏️", g: "linear-gradient(135deg,#FEF3C7,#FDE68A)", b: "#F59E0B", t: "#92400E" },
  { value: "ACTIVE"     as const, label: "Ativo",      emoji: "⚡", g: "linear-gradient(135deg,#D1FAE5,#A7F3D0)", b: "#10B981", t: "#065F46" },
  { value: "DEPRECATED" as const, label: "Depreciado", emoji: "📦", g: "linear-gradient(135deg,#FEE2E2,#FECACA)", b: "#EF4444", t: "#991B1B" },
];

// Opções de Prioridade — alinhada com a paleta do KanbanCard
export const PRIORITY_OPTS = [
  { value: "CRITICAL" as const, label: "Crítica", emoji: "🔥", g: "linear-gradient(135deg,#FEE2E2,#FECACA)", b: "#DC2626", t: "#991B1B" },
  { value: "HIGH"     as const, label: "Alta",    emoji: "⚡", g: "linear-gradient(135deg,#FFEDD5,#FED7AA)", b: "#EA580C", t: "#9A3412" },
  { value: "MEDIUM"   as const, label: "Média",   emoji: "●",  g: "linear-gradient(135deg,#DBEAFE,#BFDBFE)", b: "#2563EB", t: "#1D4ED8" },
  { value: "LOW"      as const, label: "Baixa",   emoji: "↓",  g: "linear-gradient(135deg,#F1F5F9,#E2E8F0)", b: "#94A3B8", t: "#475569" },
];

// Nome amigável do usuário pra mostrar no select de Responsável
// (cai pro email se não tiver first/last)
export function userLabel(u: { first_name: string; last_name: string; email: string }): string {
  const full = `${u.first_name} ${u.last_name}`.trim();
  return full || u.email;
}