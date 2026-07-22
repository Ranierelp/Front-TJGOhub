// =============================================================================
// KpiCards — Faixa 1 do dashboard: 4 números de impacto imediato
//
// Cada card responde uma pergunta do QA lead:
//   1. Taxa de Sucesso  → "nossa qualidade geral está boa?" (+ delta vs semana anterior)
//   2. Cobertura        → "quanto da suíte já está automatizada?"
//   3. Críticos Falhando→ "temos problema GRAVE agora?" (o mais importante)
//   4. Flaky Rate       → "quão confiáveis são nossos testes?"
//
// Padrão de cor por limiar (threshold): a cor é DERIVADA do valor na hora de
// renderizar — nunca guardada em estado. Estado é para dados; cor é cálculo.
// =============================================================================

import { TrendingUp, TrendingDown, Bot, ShieldAlert, Zap } from "lucide-react";
import type { DashboardKpis } from "@/lib/api/metrics";

interface KpiCardsProps {
  kpis: DashboardKpis;
}

// Cor da taxa de sucesso: verde ≥ 80, âmbar ≥ 60, vermelho < 60
function corDaTaxa(taxa: number | null): string {
  if (taxa === null) return "#9ca3af";
  if (taxa >= 80) return "#16a34a";
  if (taxa >= 60) return "#ca8a04";
  return "#dc2626";
}

export function KpiCards({ kpis }: KpiCardsProps) {
  const { automation_coverage: cobertura, critical_failures: criticos } = kpis;
  const temCriticoFalhando = criticos.count > 0;

  // Delta: positivo = melhorou (▲ verde); negativo = piorou (▼ vermelho)
  const delta = kpis.success_rate_delta;

  const baseCard =
    "bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 flex flex-col gap-1";
  const sombra = { boxShadow: "0 1px 4px rgba(0,0,0,0.06)" };
  const rotulo =
    "text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wide";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* ── Card 1: Taxa de Sucesso (média das runs do período) ───────────── */}
      <div className={baseCard} style={sombra}>
        <span className={rotulo}>Taxa de Sucesso</span>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold" style={{ color: corDaTaxa(kpis.success_rate) }}>
            {kpis.success_rate !== null ? `${kpis.success_rate.toFixed(1)}%` : "—"}
          </span>
          {delta !== null && (
            <span
              className="flex items-center gap-0.5 text-xs font-semibold mb-1"
              style={{ color: delta >= 0 ? "#16a34a" : "#dc2626" }}
              title="Comparado à janela anterior de mesmo tamanho"
            >
              {delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {delta >= 0 ? "+" : ""}{delta.toFixed(1)}%
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 dark:text-slate-500">média das execuções do período</span>
      </div>

      {/* ── Card 2: Cobertura de Automação ────────────────────────────────── */}
      <div className={baseCard} style={sombra}>
        <span className={rotulo}>Cobertura de Automação</span>
        <div className="flex items-end gap-2">
          <Bot size={22} className="text-blue-500 mb-1.5" />
          <span className="text-3xl font-bold text-gray-800 dark:text-slate-100">
            {cobertura.percentage.toFixed(0)}%
          </span>
        </div>
        <span className="text-xs text-gray-400 dark:text-slate-500">
          {cobertura.automated} de {cobertura.total} casos automatizados
        </span>
      </div>

      {/* ── Card 3: Críticos Falhando (destaque vermelho quando > 0) ──────── */}
      <div
        className={baseCard}
        style={{
          ...sombra,
          // Borda vermelha chama atenção imediata — é o card "de plantão"
          borderColor: temCriticoFalhando ? "#fca5a5" : undefined,
          background: temCriticoFalhando ? "rgba(220,38,38,0.04)" : undefined,
        }}
      >
        <span className={rotulo}>Críticos Falhando</span>
        <div className="flex items-end gap-2">
          <ShieldAlert
            size={22}
            className={temCriticoFalhando ? "text-red-500 mb-1.5" : "text-gray-300 dark:text-slate-600 mb-1.5"}
          />
          <span
            className="text-3xl font-bold"
            style={{ color: temCriticoFalhando ? "#dc2626" : "#16a34a" }}
          >
            {criticos.count}
          </span>
          <span className="text-sm text-gray-400 dark:text-slate-500 mb-1">
            de {criticos.total_critical}
          </span>
        </div>
        <span className="text-xs text-gray-400 dark:text-slate-500">
          casos CRÍTICOS com falha no período
        </span>
      </div>

      {/* ── Card 4: Flaky Rate ────────────────────────────────────────────── */}
      <div className={baseCard} style={sombra}>
        <span className={rotulo}>Flaky Rate</span>
        <div className="flex items-end gap-2">
          <Zap size={22} className="text-yellow-500 mb-1.5" />
          <span className="text-3xl font-bold text-gray-800 dark:text-slate-100">
            {kpis.flaky_rate.toFixed(1)}%
          </span>
        </div>
        <span className="text-xs text-gray-400 dark:text-slate-500">
          resultados instáveis sobre o total
        </span>
      </div>
    </div>
  );
}
