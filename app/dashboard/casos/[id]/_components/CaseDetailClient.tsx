"use client";

// =============================================================================
// CaseDetailClient — componente "master" da página de detalhe/edição
//
// Este componente centraliza:
//   1. Busca dos dados do caso (GET /api/v1/test-cases/{id}/)
//   2. Estado do modo (view ou edit)
//   3. Renderização condicional: CaseViewMode ↔ CaseEditForm
//
// Por que uma única página para ver E editar?
//   - UX mais fluida: o usuário não muda de URL ao editar
//   - Contexto preservado: vê os dados enquanto edita
//   - Permissões futuras: basta ocultar o botão "Editar" por role
//
// Paralelo Django:
//   Antes: DetailView + UpdateView separados (2 URLs, 2 templates)
//   Agora: uma única view que alterna entre "modo leitura" e "modo edição"
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { useRouter }                         from "next/navigation";
import { Loader2, AlertTriangle }            from "lucide-react";
import { toast }                             from "sonner";

import { get, del, api }                     from "@/lib/api";
import { GlassCard, CasePageBackground }     from "@/app/dashboard/casos/_components/CaseShared";
import { CaseViewMode }                      from "./CaseViewMode";
import { CaseEditForm }                      from "./CaseEditForm";
import type { TestCase }                     from "./CaseViewMode";

export function CaseDetailClient({ id }: { id: string }) {
  const router = useRouter();

  const [caso,      setCaso]      = useState<TestCase | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleting,  setDeleting]  = useState(false);

  // =============================================================================
  // fetchCaso — busca os dados do caso no backend
  // useCallback evita recriar a função a cada render (necessário para usar em
  // useEffect e também para ser chamada após salvar edição).
  // =============================================================================
  const fetchCaso = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get<TestCase>(`${api.endpoints.testCases}${id}/`);
      if (response.success && response.data) {
        setCaso(response.data);
      } else {
        setError("Caso de teste não encontrado.");
      }
    } catch {
      setError("Erro ao carregar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCaso(); }, [fetchCaso]);

  // Soft delete do caso — chamado pelo CaseViewMode após confirmação do usuário
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await del(`${api.endpoints.testCases}${id}/`);
      toast.success("Caso de teste excluído.");
      router.push("/dashboard/casos/");
    } catch {
      toast.error("Erro ao excluir caso de teste.");
    } finally {
      setDeleting(false);
    }
  };

  // Callback do CaseEditForm quando o PATCH foi bem-sucedido:
  // atualiza os dados localmente e volta para o modo view.
  const handleSaved = (updated: TestCase) => {
    setCaso(updated);
    setIsEditing(false);
    // Faz um novo GET para garantir que os dados estão 100% sincronizados
    // (especialmente os novos passos, cujas URLs de imagem precisam do servidor)
    fetchCaso();
  };

  // ── Estados de carregamento e erro ──────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <CasePageBackground />
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#3B82F6" }} />
          <p className="text-sm font-medium" style={{ color: "#94A3B8" }}>Carregando caso de teste...</p>
        </div>
      </div>
    );
  }

  if (error || !caso) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <CasePageBackground />
        <GlassCard className="p-8 flex flex-col items-center gap-3 max-w-sm">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(254,226,226,0.8)" }}>
            <AlertTriangle className="h-6 w-6" style={{ color: "#DC2626" }} />
          </div>
          <p className="text-sm font-semibold text-center" style={{ color: "var(--col-body)" }}>
            {error || "Caso de teste não encontrado."}
          </p>
        </GlassCard>
      </div>
    );
  }

  // ── Renderização condicional: view ↔ edit ────────────────────────────────────

  if (isEditing) {
    return (
      <CaseEditForm
        caso={caso}
        onCancel={() => setIsEditing(false)}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <CaseViewMode
      caso={caso}
      onEdit={() => setIsEditing(true)}
      onDelete={handleDelete}
      deleting={deleting}
    />
  );
}
