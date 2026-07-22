// =============================================================================
// useDashboardSummary — hook de dados do dashboard gerencial
//
// Substitui o useDashboardData (3 chamadas + agregação em JS) por UMA chamada
// ao endpoint dedicado /metrics/dashboard-summary/, que agrega tudo no banco.
//
// Recebe DOIS filtros — projectId e days — e re-busca quando qualquer um
// muda (ambos estão no array de dependências do useEffect).
//
// Mantém o padrão anti-race-condition do hook antigo: a flag `cancelado`
// vira true no cleanup, e respostas de requisições obsoletas são ignoradas
// (usuário trocou projeto A → B rápido: a resposta atrasada de A não pode
// sobrescrever os dados de B).
// =============================================================================

import { useState, useEffect, useCallback } from "react";

import {
  getDashboardSummary,
  type DashboardSummary,
  type DashboardSummaryParams,
} from "@/lib/api/metrics";

export type PeriodoDias = 7 | 14 | 30;

export interface UseDashboardSummaryReturn {
  data:    DashboardSummary | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function useDashboardSummary(
  projectId?: string,
  days: PeriodoDias = 7,
): UseDashboardSummaryReturn {
  const [data, setData]       = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  // Contador que força re-busca sem mudar os filtros ("Tentar novamente")
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelado = false;

    const buscar = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: DashboardSummaryParams = { days };
        if (projectId) params.project = projectId;

        const res = await getDashboardSummary(params);
        if (cancelado) return; // resposta obsoleta — descarta

        setData(res.data);
      } catch (err: unknown) {
        if (!cancelado) {
          const apiErr = err as { message?: string };
          setError(apiErr?.message ?? "Erro ao carregar métricas do dashboard.");
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    buscar();

    return () => { cancelado = true; };
  }, [projectId, days, refreshKey]);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  return { data, loading, error, refetch };
}
