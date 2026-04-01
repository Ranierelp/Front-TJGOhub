// =============================================================================
// ModeSelector — toggle entre "Upload Manual" e "Executar Pipeline"
//
// Componente controlado: não tem estado próprio.
// Recebe mode e onChange do pai (NovoRunClient).
//
// Paralelo: é como um <input type="radio"> — o valor vem de fora,
// o componente só exibe e reporta mudanças.
// =============================================================================

"use client";

type Mode = "upload" | "pipeline";

interface ModeSelectorProps {
  mode:     Mode;
  onChange: (mode: Mode) => void;
}

const OPTIONS: { id: Mode; icon: string; label: string; desc: string }[] = [
  {
    id:    "upload",
    icon:  "📄",
    label: "Upload Manual",
    desc:  "Enviar arquivo JSON de resultados",
  },
  {
    id:    "pipeline",
    icon:  "🚀",
    label: "Executar Pipeline",
    desc:  "Rodar testes via GitLab CI",
  },
];

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div style={{
      display: "flex",
      background: "var(--glass-card-bg)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderRadius: 12,
      border: "1px solid var(--glass-card-border)",
      padding: 4,
      marginBottom: 24,
      boxShadow: "var(--glass-shadow)",
    }}>
      {OPTIONS.map((opt) => {
        const isActive = mode === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            style={{
              flex: 1,
              padding: "14px 20px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: isActive ? "#2563eb" : "transparent",
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>{opt.icon}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: isActive ? "white" : "var(--col-heading)",
              }}>
                {opt.label}
              </div>
              <div style={{
                fontSize: 11,
                color: isActive ? "rgba(255,255,255,0.7)" : "var(--col-dim)",
              }}>
                {opt.desc}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
