// =============================================================================
// CONCEITO 2: useRef + useEffect para integrar bibliotecas externas
//
// Chart.js manipula diretamente o DOM (canvas). React não gerencia isso —
// precisamos de dois hooks para fazer essa ponte:
//
//   useRef<HTMLCanvasElement>(null)
//   → cria uma "referência" ao elemento <canvas> do DOM.
//   → É como document.getElementById(), mas idiomático no React.
//   → chartRef.current aponta para o elemento real depois de montar.
//
//   useEffect(() => { ... }, [passed, failed, skipped])
//   → roda DEPOIS que o React termina de renderizar o DOM.
//   → Só aí o <canvas> existe e podemos passar para o Chart.js.
//   → O array [passed, failed, skipped] é a "lista de dependências":
//     o efeito roda de novo toda vez que esses valores mudarem.
//
// Paralelo Django: é como um signal post_save — código que roda
// APÓS a operação principal terminar, com efeitos colaterais.
//
// POR QUE "use client"?
// Server Components rodam no servidor — não têm DOM, não têm canvas,
// não têm useRef nem useEffect. Ao adicionar "use client", dizemos ao
// Next.js: "este componente precisa rodar no browser".
//
// Regra prática: qualquer componente com useRef, useEffect, useState,
// ou eventos (onClick) precisa de "use client".
// =============================================================================
"use client";

import { useRef, useEffect } from "react";
import Chart from "chart.js/auto";

// Paleta de cores — definida fora do componente para não recriar a cada render
const CHART_COLORS = {
  passed:  "#22c55e", // green-500
  failed:  "#ef4444", // red-500
  skipped: "#d1d5db", // gray-300
} as const;

interface PassRateCardProps {
  passed: number;
  failed: number;
  skipped?: number; // opcional com default 0
}

export function PassRateCard({ passed, failed, skipped = 0 }: PassRateCardProps) {
  const total = passed + failed + skipped;

  // Taxa calculada no frontend — no Passo 6 usaremos success_rate do backend
  const rate = total > 0 ? Math.round((passed / total) * 100) : 0;

  // Cor do texto central muda conforme taxa: verde ≥80%, amarelo ≥60%, vermelho <60%
  const rateColor =
    rate >= 80 ? "#16a34a" :
    rate >= 60 ? "#ca8a04" :
                 "#dc2626";

  // useRef: guarda a referência ao <canvas> entre renders sem causar re-render.
  // Tipo genérico <HTMLCanvasElement> garante que TypeScript sabe o que esperar.
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // chartRef.current é null antes de montar. Após montar, aponta para o <canvas>.
    if (!chartRef.current) return;

    // ==========================================================================
    // Chart.js — Doughnut (rosca)
    //
    // datasets[0].data → array de valores na mesma ordem dos labels
    // cutout: "70%"    → buraco central grande (donut vs pie)
    // plugins.legend   → desativada porque fazemos nossa própria legenda abaixo
    //
    // Plugin "centerText": Chart.js não tem texto central nativo.
    // Usamos a API de plugins para desenhar no canvas diretamente após o render.
    // ==========================================================================
    const chart = new Chart(chartRef.current, {
      type: "doughnut",
      data: {
        labels: ["Passou", "Falhou", "Ignorado"],
        datasets: [{
          data: [passed, failed, skipped],
          backgroundColor: [
            CHART_COLORS.passed,
            CHART_COLORS.failed,
            CHART_COLORS.skipped,
          ],
          borderWidth: 0,       // sem borda entre fatias
          hoverOffset: 4,       // fatia "sobe" 4px ao passar o mouse
        }],
      },
      options: {
        cutout: "72%",          // tamanho do buraco central
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }, // legenda manual abaixo
          tooltip: {
            callbacks: {
              // Personaliza o texto do tooltip: "Passou: 63 (87%)"
              label: (ctx) => {
                const val = ctx.parsed as number;
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${ctx.label}: ${val} (${pct}%)`;
              },
            },
          },
        },
      },
      // Plugin inline — desenha o % no centro do donut
      plugins: [{
        id: "centerText",
        afterDraw(chart) {
          const { ctx, chartArea: { width, height, left, top } } = chart;
          ctx.save();

          const cx = left + width / 2;
          const cy = top  + height / 2;

          // Número grande (taxa)
          ctx.font      = "bold 22px sans-serif";
          ctx.fillStyle = rateColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${rate}%`, cx, cy - 7);

          // Linha menor com total
          ctx.font      = "11px sans-serif";
          ctx.fillStyle = "#9ca3af"; // gray-400
          ctx.fillText(`${total} testes`, cx, cy + 12);

          ctx.restore();
        },
      }],
    });

    // ==========================================================================
    // CLEANUP — por que é obrigatório?
    //
    // O Chart.js registra o canvas internamente. Se o componente re-renderizar
    // (ex: props mudaram) e criarmos um segundo Chart no mesmo canvas SEM
    // destruir o primeiro, o Chart.js lança erro:
    //   "Canvas is already in use. Chart with ID X must be destroyed first."
    //
    // O return de useEffect é a função de cleanup — roda antes do próximo
    // efeito ou quando o componente desmonta.
    //
    // Paralelo Python: é como um __exit__ de context manager ou um finally{}.
    // ==========================================================================
    return () => chart.destroy();

  // Dependências: recria o chart quando os dados mudarem (Passo 6 — dados reais)
  }, [passed, failed, skipped, rate, rateColor, total]);

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 flex flex-col gap-4"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      <span className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wide">
        Pass Rate
      </span>

      {/*
        <canvas> com tamanho fixo — Chart.js usa isso como base para o responsive.
        O ref conecta o elemento real ao chartRef para o useEffect usar.
      */}
      <div className="flex items-center justify-center flex-1 py-1">
        <canvas ref={chartRef} width={160} height={160} />
      </div>

      {/* Legenda manual — mostra passed/failed/skipped com cor e valor */}
      <div className="flex justify-center gap-4 text-xs text-gray-500 dark:text-slate-400 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
            style={{ background: CHART_COLORS.passed }} />
          Passou: <strong className="text-gray-700 dark:text-slate-200">{passed}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
            style={{ background: CHART_COLORS.failed }} />
          Falhou: <strong className="text-gray-700 dark:text-slate-200">{failed}</strong>
        </span>
        {skipped > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
              style={{ background: CHART_COLORS.skipped }} />
            Skip: <strong className="text-gray-700 dark:text-slate-200">{skipped}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
