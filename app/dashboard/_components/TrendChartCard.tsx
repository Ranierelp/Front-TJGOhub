// =============================================================================
// CONCEITO 5: Multi-dataset no Chart.js — barras empilhadas
//
// O gráfico de donut (PassRateCard) tem 1 dataset com N fatias.
// Este gráfico de barras tem 4 datasets (passed, failed, flaky, skipped),
// cada um sendo uma "camada" da barra empilhada.
//
// A diferença na config:
//   datasets: [{ label: "Passou", data: [45,51,...] }, { label: "Falhou", ... }]
//   options.scales.x.stacked: true   → empilha no eixo X
//   options.scales.y.stacked: true   → empilha no eixo Y
//
// Sem stacked, seriam barras agrupadas lado a lado.
// Com stacked, cada barra mostra a composição do dia: passou + falhou + flaky + skip.
//
// CONCEITO 5b: Transformando array de objetos em arrays paralelos
//
//   data = [ { date:"22/02", passed:45, failed:12 }, ... ]
//
//   Para o Chart.js precisamos de arrays separados:
//   labels  = ["22/02", "23/02", ...]   → extraído com .map(d => d.date)
//   passed  = [45, 51, ...]             → extraído com .map(d => d.passed)
//
//   É como fazer um "pivot" de linhas para colunas.
//   Paralelo Python: [d["date"] for d in data]
// =============================================================================
"use client";

import { useRef, useEffect } from "react";
import Chart from "chart.js/auto";

// Paleta — fora do componente para não recriar a cada render
const COLORS = {
  passed:  { bg: "#22c55e", border: "#16a34a" }, // green
  failed:  { bg: "#ef4444", border: "#dc2626" }, // red
  flaky:   { bg: "#f59e0b", border: "#d97706" }, // amber
  skipped: { bg: "#d1d5db", border: "#9ca3af" }, // gray
} as const;

export interface TrendDataPoint {
  date: string;         // "22/02" — formatado para exibição
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  success_rate: number; // 0-100
}

interface TrendChartCardProps {
  data: TrendDataPoint[];
}

export function TrendChartCard({ data }: TrendChartCardProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // ==========================================================================
    // Transformação: array de objetos → arrays paralelos para o Chart.js
    //
    // data = [ { date:"22/02", passed:45, failed:12, ... }, ... ]
    //
    // labels  = ["22/02", "23/02", ...]   ← eixo X
    // passed  = [45, 51, ...]             ← dataset 1
    // failed  = [12, 9, ...]              ← dataset 2
    // etc.
    // ==========================================================================
    const labels  = data.map((d) => d.date);
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
            label: "Passou",
            data: passed,
            backgroundColor: COLORS.passed.bg,
            borderColor:     COLORS.passed.border,
            borderWidth: 0,
            borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 3, bottomRight: 3 },
            borderSkipped: false,
          },
          {
            label: "Falhou",
            data: failed,
            backgroundColor: COLORS.failed.bg,
            borderColor:     COLORS.failed.border,
            borderWidth: 0,
          },
          {
            label: "Flaky",
            data: flaky,
            backgroundColor: COLORS.flaky.bg,
            borderColor:     COLORS.flaky.border,
            borderWidth: 0,
          },
          {
            label: "Ignorado",
            data: skipped,
            backgroundColor: COLORS.skipped.bg,
            borderColor:     COLORS.skipped.border,
            borderWidth: 0,
            // Borda arredondada só no topo da barra (último dataset empilhado)
            borderRadius: { topLeft: 3, topRight: 3, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // permite controlar altura pelo container
        // stacked: true em AMBOS os eixos — sem isso as barras ficam lado a lado
        scales: {
          x: {
            stacked: true,
            grid: { display: false },      // remove linhas verticais de grid
            ticks: { color: "#9ca3af", font: { size: 11 } },
          },
          y: {
            stacked: true,
            grid: { color: "#f3f4f6" },    // linhas horizontais bem suaves
            ticks: {
              color: "#9ca3af",
              font: { size: 11 },
              // Mostra apenas inteiros no eixo Y
              callback: (val) => Number.isInteger(val) ? val : null,
            },
          },
        },
        plugins: {
          // Legenda acima do gráfico — posição "top", alinhada à esquerda
          legend: {
            position: "top",
            align: "start",
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              borderRadius: 3,
              useBorderRadius: true,
              color: "#6b7280",
              font: { size: 11 },
              padding: 16,
            },
          },
          tooltip: {
            mode: "index",    // mostra todos os datasets do mesmo dia no tooltip
            intersect: false, // tooltip aparece ao passar na coluna, não só na barra
            callbacks: {
              // Rodapé do tooltip: taxa de sucesso do dia
              footer: (items) => {
                const idx = items[0]?.dataIndex ?? 0;
                return `Taxa: ${data[idx].success_rate.toFixed(1)}%`;
              },
            },
          },
        },
      },
    });

    // Cleanup: destrói o chart antes de recriar (evita erro "canvas already in use")
    return () => chart.destroy();

  }, [data]); // Recria o chart quando os dados mudarem (Passo 6 — dados reais)

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      {/* Cabeçalho + dropdown de período (estático — Passo 7 adiciona interatividade) */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Tendência Pass/Fail</h2>
          <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">Últimos 7 dias</p>
        </div>

        {/* Select estático — no Passo 7 controlará o período via useState */}
        <select className="text-xs border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>Últimos 7 dias</option>
          <option>Últimos 14 dias</option>
          <option>Últimos 30 dias</option>
        </select>
      </div>

      {/*
        Container com altura fixa — necessário porque maintainAspectRatio=false.
        O <canvas> se expande para preencher o container pai.
        Sem height fixo aqui, o gráfico colapsaria para 0px de altura.
      */}
      <div style={{ height: 280 }}>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
}
