// =============================================================================
// TrendChartCard — Faixa 4: tendência diária (barras empilhadas)
//
// Evolução (redesign): o select de período deixou de ser decorativo.
// Agora é um componente CONTROLADO: recebe `days` e `onDaysChange` do pai
// (DashboardClient). Trocar o período sobe o evento → o pai atualiza o
// estado → o hook re-busca → novos dados descem via props. O dado flui
// para BAIXO, o evento flui para CIMA — o ciclo básico do React.
//
// Cada barra agora é UM DIA (agregado no banco), não uma run individual.
// =============================================================================
"use client";

import { useRef, useEffect } from "react";
import Chart from "chart.js/auto";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { TrendPoint } from "@/lib/api/metrics";
import type { PeriodoDias } from "@/hooks/useDashboardSummary";

// Paleta — fora do componente para não recriar a cada render
const COLORS = {
  passed:  { bg: "#22c55e" }, // green
  failed:  { bg: "#ef4444" }, // red
  flaky:   { bg: "#f59e0b" }, // amber
  skipped: { bg: "#d1d5db" }, // gray
} as const;

interface TrendChartCardProps {
  data:         TrendPoint[];
  days:         PeriodoDias;
  onDaysChange: (days: PeriodoDias) => void;
}

// "2026-07-21" → "21/07" (rótulo curto do eixo X)
function rotuloData(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

export function TrendChartCard({ data, days, onDaysChange }: TrendChartCardProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Array de objetos → arrays paralelos (formato que o Chart.js espera)
    const labels  = data.map((d) => rotuloData(d.date));
    const passed  = data.map((d) => d.passed);
    const failed  = data.map((d) => d.failed);
    const flaky   = data.map((d) => d.flaky);
    const skipped = data.map((d) => d.skipped);

    const chart = new Chart(chartRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Passou", data: passed, backgroundColor: COLORS.passed.bg, borderWidth: 0,
            borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 3, bottomRight: 3 }, borderSkipped: false,
          },
          { label: "Falhou", data: failed, backgroundColor: COLORS.failed.bg, borderWidth: 0 },
          { label: "Flaky",  data: flaky,  backgroundColor: COLORS.flaky.bg,  borderWidth: 0 },
          {
            label: "Ignorado", data: skipped, backgroundColor: COLORS.skipped.bg, borderWidth: 0,
            borderRadius: { topLeft: 3, topRight: 3, bottomLeft: 0, bottomRight: 0 }, borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // stacked em AMBOS os eixos — sem isso as barras ficam lado a lado
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: "#9ca3af", font: { size: 11 } } },
          y: {
            stacked: true,
            grid: { color: "#f3f4f6" },
            ticks: {
              color: "#9ca3af", font: { size: 11 },
              callback: (val) => (Number.isInteger(val) ? val : null),
            },
          },
        },
        plugins: {
          legend: {
            position: "top", align: "start",
            labels: {
              boxWidth: 10, boxHeight: 10, borderRadius: 3, useBorderRadius: true,
              color: "#6b7280", font: { size: 11 }, padding: 16,
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              // Taxa do dia calculada aqui: passou / executados (skipped fora)
              footer: (items) => {
                const d = data[items[0]?.dataIndex ?? 0];
                const executados = d.passed + d.failed + d.flaky;
                if (!executados) return "";
                return `Taxa: ${((d.passed / executados) * 100).toFixed(1)}%`;
              },
            },
          },
        },
      },
    });

    // Cleanup: destrói o chart antes de recriar (evita "canvas already in use")
    return () => chart.destroy();
  }, [data]);

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Tendência Pass/Fail</h2>
          <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">Últimos {days} dias · por dia</p>
        </div>

        {/* Select CONTROLADO — o valor vem do pai, a mudança sobe pro pai */}
        <Select value={String(days)} onValueChange={(v) => onDaysChange(Number(v) as PeriodoDias)}>
          <SelectTrigger className="w-auto h-auto py-1.5 text-xs gap-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="14">Últimos 14 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Altura fixa obrigatória — maintainAspectRatio=false colapsa sem ela */}
      <div style={{ height: 280 }}>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
}
