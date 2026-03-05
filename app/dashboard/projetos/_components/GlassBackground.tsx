// Fundo glassmorphism compartilhado entre as telas de projetos.
// Renderizado como fixed (-z-10) para não afetar o layout.
export function GlassBackground() {
  return (
    <div className="fixed inset-0 -z-10" style={{ background: "var(--page-bg)" }}>
      <div className="absolute" style={{
        width: 600, height: 600, top: -100, right: -100,
        background: "radial-gradient(circle,rgba(59,130,246,0.08) 0%,transparent 70%)",
        borderRadius: "50%", filter: "blur(40px)",
        animation: "float1 20s ease-in-out infinite",
      }} />
      <div className="absolute" style={{
        width: 500, height: 500, bottom: -50, left: -100,
        background: "radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 70%)",
        borderRadius: "50%", filter: "blur(40px)",
        animation: "float2 25s ease-in-out infinite",
      }} />
      <div className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(rgba(148,163,184,0.12) 1px,transparent 1px)",
        backgroundSize: "24px 24px",
      }} />
    </div>
  );
}

// Card de vidro reutilizável com suporte a hover interativo
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className = "", interactive, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl transition-all duration-200 ${interactive ? "cursor-pointer" : ""} ${className}`}
      style={{
        background: "var(--glass-card-bg)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid var(--glass-card-border)",
        boxShadow: "var(--glass-shadow)",
      }}
      onMouseEnter={interactive ? (e) => {
        const el = e.currentTarget;
        el.style.borderColor = "rgba(147,197,253,0.6)";
        el.style.boxShadow = "0 8px 32px rgba(37,99,235,0.08),0 2px 8px rgba(0,0,0,0.04)";
      } : undefined}
      onMouseLeave={interactive ? (e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--glass-card-border)";
        el.style.boxShadow = "var(--glass-shadow)";
      } : undefined}
    >
      {children}
    </div>
  );
}
