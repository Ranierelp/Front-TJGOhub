// =============================================================================
// Hook de criação de caso de teste
//
// Responsabilidades:
//   1. Buscar projetos e tags para popular os selects do formulário
//   2. Submeter o caso (POST /api/v1/test-cases/)
//   3. Enviar cada passo com imagem (POST /api/v1/test-cases/{id}/add-attachment/)
//
// Paralelo Django: é como uma view que primeiro faz o form.save() e depois
// processa os inline formsets de passos — tudo dentro de uma "transação" de UX.
// =============================================================================

import { useState, useEffect } from "react";
import { useRouter }           from "next/navigation";
import { toast }               from "sonner";

import { get, post, upload, api } from "@/lib/api";

// Um passo do caso de teste — imagem é opcional
export interface PendingStep {
  description: string;
  image?:      File;
  preview?:    string; // base64 data URL gerada pelo FileReader (compatível com CSP)
}

interface ApiProject { id: string; name: string; }
interface ApiTag     { id: string; name: string; color: string; }
interface DRFList<T> { results: T[]; }

export interface UseCreateCaseReturn {
  projects:   ApiProject[];
  tags:       ApiTag[];
  loading:    boolean;
  submitting: boolean;
  submit:     (formData: Record<string, unknown>, steps: PendingStep[]) => Promise<void>;
}

export function useCreateCase(): UseCreateCaseReturn {
  const router = useRouter();

  const [projects,   setProjects]   = useState<ApiProject[]>([]);
  const [tags,       setTags]       = useState<ApiTag[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [projResp, tagsResp] = await Promise.all([
          get<DRFList<ApiProject>>(api.endpoints.projects),
          get<DRFList<ApiTag>>(api.endpoints.tags),
        ]);
        setProjects(projResp.data.results);
        setTags(tagsResp.data.results);
      } catch {
        toast.error("Erro ao carregar projetos e tags");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Cria o caso e depois faz upload apenas dos passos que têm imagem
  const submit = async (formData: Record<string, unknown>, steps: PendingStep[]) => {
    setSubmitting(true);
    try {
      const caseResp = await post<{ id: string }>(api.endpoints.testCases, formData);
      const caseId   = caseResp.data.id;

      const attachUrl = `${api.endpoints.testCases}${caseId}/add-attachment/`;
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (!step.image) continue; // passos sem imagem são ignorados
        const fd = new FormData();
        fd.append("file",        step.image);
        fd.append("title",       `Passo ${i + 1}`);
        fd.append("description", step.description);
        fd.append("order",       String(i));
        await upload(attachUrl, fd);
      }

      toast.success("Caso de teste criado com sucesso!");
      router.push(`/dashboard/casos/${caseId}/`);
    } catch (err: unknown) {
      // ApiError do client.ts tem `details` com os erros de campo do DRF
      const apiErr = err as { message?: string; details?: Record<string, string | string[]> };
      if (apiErr.details && typeof apiErr.details === "object") {
        const fieldErrors = Object.entries(apiErr.details)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join("\n");
        toast.error(fieldErrors || apiErr.message || "Erro ao criar caso de teste");
      } else {
        toast.error(apiErr.message ?? "Erro ao criar caso de teste");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return { projects, tags, loading, submitting, submit };
}
