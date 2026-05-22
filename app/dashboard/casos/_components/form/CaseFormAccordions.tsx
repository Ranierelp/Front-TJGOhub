"use client";

// =============================================================================
// CaseFormAccordions — os 3 accordions de texto livre do fim do formulário.
//
// Compartilhado entre criar e editar caso. O único parâmetro variável é se
// começam abertos por padrão (no editar começam abertos pra mostrar conteúdo).
// =============================================================================

import type { UseFormRegister, FieldValues, Path } from "react-hook-form";
import { Accordion } from "@/app/dashboard/casos/_components/CaseShared";
import type { CaseFormBaseData } from "./types";

interface Props<T extends FieldValues & CaseFormBaseData> {
  register:    UseFormRegister<T>;
  defaultOpen?: boolean;
}

export function CaseFormAccordions<T extends FieldValues & CaseFormBaseData>({ register, defaultOpen = false }: Props<T>) {
  // O cast `as Path<T>` é necessário porque o tipo genérico T pode ter campos
  // extras (ex: `project` no Create), mas garantimos via constraint que ele
  // tem pelo menos os do CaseFormBaseData.
  const reg = (field: keyof CaseFormBaseData) => register(field as Path<T>);

  return (
    <div className="space-y-3 pt-2">
      <Accordion title="Resultado Esperado" emoji="✅" defaultOpen={defaultOpen}>
        <textarea {...reg("expected_result")} placeholder="Descreva o resultado esperado..." rows={4}
          className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm resize-none" style={{ lineHeight: "1.7" }} />
      </Accordion>

      <Accordion title="Observações" emoji="📝" defaultOpen={defaultOpen}>
        <textarea {...reg("observations")} placeholder="Adicione observações ou notas..." rows={4}
          className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm resize-none" style={{ lineHeight: "1.7" }} />
      </Accordion>

      <Accordion title="Objetivo / Pré-condições / Pós-condições" emoji="🎯" defaultOpen={defaultOpen}>
        <div className="space-y-3">
          <textarea {...reg("objective")}      placeholder="Objetivo do teste..."          rows={2} className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm resize-none" style={{ lineHeight: "1.6" }} />
          <textarea {...reg("preconditions")}  placeholder="Pré-condições necessárias..." rows={2} className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm resize-none" style={{ lineHeight: "1.6" }} />
          <textarea {...reg("postconditions")} placeholder="Pós-condições esperadas..."   rows={2} className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm resize-none" style={{ lineHeight: "1.6" }} />
        </div>
      </Accordion>
    </div>
  );
}