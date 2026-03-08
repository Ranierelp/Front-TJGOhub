// Barra visual de proporcao colorida:
//   verde  = passed
//   vermelho = failed
//   amarelo  = flaky
//   cinza    = skipped
//
// Cada segmento tem width proporcional ao total de testes.
// title="" torna o segmento acessivel via tooltip nativo.

import type { TestRunDetail } from "@/lib/api/runs";

interface RunProgressBarProps {
  run: TestRunDetail;
}

export function RunProgressBar({ run }: RunProgressBarProps) {
  const total = run.total_tests || 1;  // evita divisao por zero

  const passedPct  = (run.passed_tests  / total) * 100;
  const failedPct  = (run.failed_tests  / total) * 100;
  const flakyPct   = (run.flaky_tests   / total) * 100;
  const skippedPct = (run.skipped_tests / total) * 100;

  return (
    <div
      className="flex h-3 rounded-full overflow-hidden gap-px"
      role="img"
      aria-label={`${run.passed_tests} passou, ${run.failed_tests} falhou, ${run.flaky_tests} flaky, ${run.skipped_tests} pulado`}
    >
      {passedPct  > 0 && (
        <div
          style={{ width: `${passedPct}%`, background: "#16a34a" }}
          title={`${run.passed_tests} passed`}
        />
      )}
      {failedPct  > 0 && (
        <div
          style={{ width: `${failedPct}%`, background: "#dc2626" }}
          title={`${run.failed_tests} failed`}
        />
      )}
      {flakyPct   > 0 && (
        <div
          style={{ width: `${flakyPct}%`, background: "#ca8a04" }}
          title={`${run.flaky_tests} flaky`}
        />
      )}
      {skippedPct > 0 && (
        <div
          style={{ width: `${skippedPct}%`, background: "#64748b" }}
          title={`${run.skipped_tests} skipped`}
        />
      )}
    </div>
  );
}
