"use client";

// =============================================================================
// Tela 3 — Editar Projeto
// Carrega o projeto pelo ID e alimenta o ProjectFormClient com os dados.
// =============================================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { getProject, updateProject, archiveProject, type ProjectDetail } from "@/lib/api/projects";
import { ProjectFormClient } from "../../../_components/ProjectFormClient";
import { ArchiveModal } from "../../../_components/ProjectModals";

export function EditProjectClient({ id }: { id: string }) {
  const router = useRouter();
  const [project, setProject]     = useState<ProjectDetail | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    getProject(id)
      .then((r) => setProject(r.data))
      .catch(() => setError("Projeto não encontrado"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleArchive() {
    if (!project) return;
    try {
      await archiveProject(project.id);
      toast.success("Projeto arquivado com sucesso!");
      router.push("/dashboard/projetos");
    } catch {
      toast.error("Erro ao arquivar projeto");
    } finally {
      setArchiving(false);
    }
  }

  async function handleSubmit(data: { name: string; description: string }) {
    try {
      await updateProject(id, data);
      toast.success("Projeto atualizado com sucesso!");
      router.push(`/dashboard/projetos/${id}`);
    } catch (err: any) {
      const msg = err?.details?.name?.[0] || err?.message || "Erro ao salvar";
      toast.error(msg);
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-64">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#3B82F6" }} />
    </div>
  );

  if (error || !project) return (
    <div className="flex flex-col items-center py-20 gap-3">
      <AlertCircle className="h-8 w-8" style={{ color: "#EF4444" }} />
      <p className="text-sm" style={{ color: "var(--col-muted)" }}>{error || "Projeto não encontrado"}</p>
    </div>
  );

  return (
    <>
      <ProjectFormClient
        mode="edit"
        initialData={{ name: project.name, description: project.description, slug: project.slug }}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/dashboard/projetos/${id}`)}
        onArchive={() => setArchiving(true)}
      />
      {archiving && (
        <ArchiveModal
          project={project as any}
          onConfirm={handleArchive}
          onCancel={() => setArchiving(false)}
        />
      )}
    </>
  );
}
