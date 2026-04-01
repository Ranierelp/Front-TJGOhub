// =============================================================================
// StepIndicator — barra de progresso com 3 steps conectados
//
// Aparência:
//   ●─────────○─────────○
//   1         2         3
//   Selecionar Validar  Concluído
//
//   ● azul = step atual
//   ✓ azul = step concluído
//   ○ cinza = step futuro
// =============================================================================

"use client";

const STEPS = [
  { number: 1, label: "Selecionar" },
  { number: 2, label: "Validar" },
  { number: 3, label: "Concluído" },
];

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
      {STEPS.map((step, i) => {
        const isDone    = step.number < currentStep;
        const isActive  = step.number === currentStep;

        return (
          <div key={step.number} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? "1 1 0" : "none" }}>
            {/* Círculo do step */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                border: `2px solid ${isDone || isActive ? "#2563eb" : "var(--glass-card-border)"}`,
                background: isDone || isActive ? "#2563eb" : "var(--glass-card-bg)",
                color: isDone || isActive ? "white" : "var(--col-dim)",
                transition: "all 0.2s",
              }}>
                {isDone ? "✓" : step.number}
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? "#2563eb" : isDone ? "#2563eb" : "var(--col-dim)",
                whiteSpace: "nowrap" as const,
              }}>
                {step.label}
              </span>
            </div>

            {/* Linha conectora (exceto no último step) */}
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1,
                height: 2,
                background: isDone ? "#2563eb" : "var(--glass-card-border)",
                margin: "0 8px",
                marginBottom: 20, // alinha com centro dos círculos (círculo + label)
                transition: "background 0.3s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
