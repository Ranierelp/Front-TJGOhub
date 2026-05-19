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
// Usuário para o select de "Responsável" — só os campos que a UI precisa.
// O backend retorna mais coisas (groups, is_staff etc.), mas ignoramos.
export interface ApiUser {
  id:         string;
  email:      string;
  first_name: string;
  last_name:  string;
}
interface DRFList<T> { results: T[]; }

export interface UseCreateCaseReturn {
  projects:   ApiProject[];
  tags:       ApiTag[];
  users:      ApiUser[];
  loading:    boolean;
  submitting: boolean;
  submit:     (formData: Record<string, unknown>, steps: PendingStep[]) => Promise<void>;
}

export function useCreateCase(): UseCreateCaseReturn {
  const router = useRouter();

  const [projects,   setProjects]   = useState<ApiProject[]>([]);
  const [tags,       setTags]       = useState<ApiTag[]>([]);
  const [users,      setUsers]      = useState<ApiUser[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [projResp, tagsResp, usersResp] = await Promise.all([
          get<DRFList<ApiProject>>(api.endpoints.projects),
          get<DRFList<ApiTag>>(api.endpoints.tags),
          get<DRFList<ApiUser>>(api.endpoints.users),
        ]);
        setProjects(projResp.data.results);
        setTags(tagsResp.data.results);
        setUsers(usersResp.data.results);
      } catch {
        toast.error("Erro ao carregar dados do formulário");
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

      // Envia todos os passos — a imagem é opcional.
      // Passos só com descrição (sem imagem) também são persistidos.
      const attachUrl = `${api.endpoints.testCases}${caseId}/add-attachment/`;
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        // Ignora passos completamente vazios (sem imagem E sem descrição)
        if (!step.image && !step.description.trim()) continue;
        const fd = new FormData();
        if (step.image) fd.append("file", step.image);
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

  return { projects, tags, users, loading, submitting, submit };
}
