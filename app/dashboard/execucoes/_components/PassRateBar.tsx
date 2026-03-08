// Barra de progresso com cor adaptativa:
//   >= 80% → verde (bom)
//   >= 50% → amarelo (atencao)
//   <  50% → vermelho (critico)

interface PassRateBarProps {
  rate: number;         // valor de 0 a 100
  showLabel?: boolean;
  className?: string;
}

function getBarColor(rate: number): string {
  if (rate >= 80) return "#16a34a";
  if (rate >= 50) return "#ca8a04";
  return "#dc2626";
}

export function PassRateBar({
  rate,
  showLabel = true,
  className = "",
}: PassRateBarProps) {
  const color = getBarColor(rate);
  const width = Math.min(100, Math.max(0, rate));

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--glass-inner-border)" }}
        role="progressbar"
        aria-valuenow={width}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
      {showLabel && (
        <span
          className="text-xs font-semibold w-10 text-right tabular-nums"
          style={{ color }}
        >
          {rate.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
