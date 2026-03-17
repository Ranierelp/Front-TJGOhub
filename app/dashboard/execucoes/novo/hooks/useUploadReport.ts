// =============================================================================
// Hook de upload de relatório
//
// Por que separar em hook?
//   O componente UploadPreview só precisa saber: "está carregando?", "deu erro?"
//   e "como eu chamo o envio?". A lógica de fazer o POST, tratar erros e
//   atualizar estados fica aqui — o componente só renderiza.
//
// Paralelo Django: é como ter um Service separado da View.
//   A View (componente) apenas chama o Service (hook) e exibe o resultado.
// =============================================================================

import { useState } from "react";
import { uploadReport } from "@/lib/api/runs";
import type { UploadReportResponse } from "@/lib/api/runs";

export function useUploadReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const submit = async (payload: unknown): Promise<UploadReportResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await uploadReport(payload);
      return res.data; // { run_id, id, status: "PENDING", detail }
    } catch (err: any) {
      // err.message vem do interceptor do client.ts (já em PT-BR)
      setError(err.message ?? "Erro ao enviar relatório. Tente novamente.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error };
}
