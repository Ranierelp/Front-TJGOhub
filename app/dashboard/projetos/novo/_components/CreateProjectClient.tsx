"use client";

// =============================================================================
// Tela 2 — Criar Projeto
// Usa o ProjectFormClient compartilhado com modo "create".
// =============================================================================

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProject } from "@/lib/api/projects";
import { ProjectFormClient } from "../../_components/ProjectFormClient";

export function CreateProjectClient() {
  const router = useRouter();

  async function handleSubmit(data: { name: string; description: string }) {
    try {
      const resp = await createProject(data);
      toast.success("Projeto criado com sucesso!");
      router.push(`/dashboard/projetos/${resp.data.id}`);
    } catch (err: any) {
      const msg = err?.details?.name?.[0] || err?.message || "Erro ao criar projeto";
      toast.error(msg);
    }
  }

  return (
    <ProjectFormClient
      mode="create"
      onSubmit={handleSubmit}
      onCancel={() => router.push("/dashboard/projetos")}
    />
  );
}
