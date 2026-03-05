// =============================================================================
// Hook de edição/exclusão de caso de teste
//
// Responsabilidades:
//   1. Buscar projetos e tags para popular os selects do formulário de edição
//   2. Atualizar o caso (PATCH /api/v1/test-cases/{id}/)
//   3. Adicionar novos passos (POST /api/v1/test-cases/{id}/add-attachment/)
//   4. Remover passo existente (DELETE /api/v1/test-cases/{id}/remove-attachment/{aid}/)
//   5. Excluir o caso (DELETE /api/v1/test-cases/{id}/)
//
// Diferença de useCreateCase: recebe o `caseId` como parâmetro pois todas as
// operações precisam do ID do caso já existente.
// =============================================================================

import { useState, useEffect } from "react";
import { useRouter }           from "next/navigation";
import { toast }               from "sonner";

import { get, patch, del, upload, api } from "@/lib/api";
import apiClient                        from "@/lib/api/client";
import type { PendingStep }             from "./useCreateCase";

interface ApiProject { id: string; name: string; }
interface ApiTag     { id: string; name: string; color: string; }
interface DRFList<T> { results: T[]; }

export interface UseEditCaseReturn {
  projects:         ApiProject[];
  tags:             ApiTag[];
  loading:          boolean;  // carregando projetos/tags
  submitting:       boolean;  // PATCH em andamento
  deleting:         boolean;  // DELETE em andamento
  update:           (formData: Record<string, unknown>, newSteps: PendingStep[]) => Promise<void>;
  deleteCase:       () => Promise<void>;
  removeAttachment: (attachmentId: string) => Promise<void>;
  updateAttachment: (attachmentId: string, description: string, newImage?: File) => Promise<void>;
}

export function useEditCase(caseId: string): UseEditCaseReturn {
  const router = useRouter();

  const [projects,   setProjects]   = useState<ApiProject[]>([]);
  const [tags,       setTags]       = useState<ApiTag[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  // Carrega projetos e tags — necessários para os selects do formulário de edição
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

  // =============================================================================
  // update — PATCH dos campos principais + upload dos novos passos
  //
  // Paralelo Django:
  //   form.save(commit=True)    → PATCH dos campos textuais/seleções
  //   formset.save()            → add-attachment para cada novo passo com imagem
  //
  // "newSteps" são os passos adicionados NESTA sessão de edição (não os existentes).
  // =============================================================================
  const update = async (formData: Record<string, unknown>, newSteps: PendingStep[]) => {
    setSubmitting(true);
    try {
      await patch(`${api.endpoints.testCases}${caseId}/`, formData);

      // Envia somente os novos passos que têm imagem
      const attachUrl = `${api.endpoints.testCases}${caseId}/add-attachment/`;
      for (let i = 0; i < newSteps.length; i++) {
        const step = newSteps[i];
        if (!step.image) continue;
        const fd = new FormData();
        fd.append("file",        step.image);
        fd.append("title",       `Passo ${i + 1}`);
        fd.append("description", step.description);
        fd.append("order",       String(9000 + i)); // ordem alta: novos passos vêm depois dos existentes
        await upload(attachUrl, fd);
      }

      toast.success("Caso de teste atualizado!");
    } catch (err: unknown) {
      const apiErr = err as { message?: string; details?: Record<string, string | string[]> };
      if (apiErr.details && typeof apiErr.details === "object") {
        const fieldErrors = Object.entries(apiErr.details)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join("\n");
        toast.error(fieldErrors || apiErr.message || "Erro ao salvar");
      } else {
        toast.error(apiErr.message ?? "Erro ao salvar caso de teste");
      }
      throw err; // re-lança para que CaseEditForm saiba que falhou e não feche o modo edit
    } finally {
      setSubmitting(false);
    }
  };

  // =============================================================================
  // deleteCase — soft delete do caso de teste
  // Após excluir, redireciona para a listagem.
  // =============================================================================
  const deleteCase = async () => {
    setDeleting(true);
    try {
      await del(`${api.endpoints.testCases}${caseId}/`);
      toast.success("Caso de teste excluído.");
      router.push("/dashboard/casos/");
    } catch {
      toast.error("Erro ao excluir caso de teste.");
    } finally {
      setDeleting(false);
    }
  };

  // =============================================================================
  // removeAttachment — DELETE permanente de um passo/anexo específico
  // O componente pai deve remover o item do array de attachments localmente após sucesso.
  // =============================================================================
  const removeAttachment = async (attachmentId: string) => {
    try {
      await del(`${api.endpoints.testCases}${caseId}/remove-attachment/${attachmentId}/`);
      toast.success("Passo removido.");
    } catch {
      toast.error("Erro ao remover passo.");
      throw new Error("Falha ao remover passo");
    }
  };

  // =============================================================================
  // updateAttachment — PATCH multipart de descrição e/ou imagem de um passo existente
  //
  // Usa apiClient.patch() diretamente pois o utilitário `patch()` não define
  // Content-Type multipart — deixamos o Axios detectar o FormData automaticamente.
  // =============================================================================
  const updateAttachment = async (attachmentId: string, description: string, newImage?: File) => {
    const fd = new FormData();
    fd.append("description", description);
    if (newImage) fd.append("file", newImage);
    try {
      await apiClient.patch(
        `${api.endpoints.testCases}${caseId}/update-attachment/${attachmentId}/`,
        fd,
        // Axios detecta FormData e define Content-Type: multipart/form-data com boundary
      );
    } catch {
      toast.error("Erro ao salvar passo.");
      throw new Error("Falha ao atualizar passo");
    }
  };

  return { projects, tags, loading, submitting, deleting, update, deleteCase, removeAttachment, updateAttachment };
}
