// =============================================================================
// Histórico de edições de um TestCase — tipos + função de leitura.
// Endpoint: GET /api/v1/test-cases/{id}/history/
//
// O backend monta a timeline lendo as shadow tables do django-simple-history
// (uma pra TestCase e outra pra TestCaseAttachment). Cada item da lista é
// uma "entrada" cronológica que já vem com labels PT-BR e valores formatados
// prontos pra UI — o front só precisa renderizar.
// =============================================================================

import { get, api } from "./index";

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface HistoryAuthor {
  id:       string;          // UUID
  name:     string;          // nome completo ou email
  initials: string;          // ex.: "RP"
  avatar:   string | null;   // URL absoluta da foto, ou null
}

// Mudança em campo simples (status/prioridade/título/etc.)
export interface FieldChange {
  field: string;          // ex.: "priority"
  label: string;          // já em PT-BR: "Prioridade"
  from:  string | null;   // valor anterior já traduzido ("Média")
  to:    string | null;   // valor novo já traduzido ("Alta")
}

// Mudança em M2M de tags (single entry quando houve adição/remoção)
export interface TagsChange {
  field:   "tags";
  label:   "Tags";
  added:   string[];   // nomes das tags adicionadas
  removed: string[];   // nomes das tags removidas
}

export type CaseChange = FieldChange | TagsChange;

// Discriminated union por `kind`
export type CaseHistoryEntry =
  | {
      kind:      "create" | "edit";
      edited_at: string;                  // ISO 8601
      edited_by: HistoryAuthor | null;    // null em casos legados (sem auditor)
      changes:   CaseChange[];            // [] quando kind === "create"
    }
  | {
      kind:       "attachment_added" | "attachment_updated" | "attachment_removed";
      edited_at:  string;
      edited_by:  HistoryAuthor | null;
      attachment: { id: string; title: string; order: number };
    };

// ── Type guards (úteis pro front discriminar) ────────────────────────────────

export function isTagsChange(c: CaseChange): c is TagsChange {
  return c.field === "tags";
}

export function isFieldChange(c: CaseChange): c is FieldChange {
  return c.field !== "tags";
}

// ── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchCaseHistory(caseId: string): Promise<CaseHistoryEntry[]> {
  const url = `${api.endpoints.testCases}${caseId}/history/`;
  const resp = await get<CaseHistoryEntry[]>(url);
  return resp.data;
}
