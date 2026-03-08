// Cabecalho da listagem: titulo com contagem + botao "Nova Execucao"

import { Play } from "lucide-react";

interface RunsHeaderProps {
  total: number;
}

export function RunsHeader({ total }: RunsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium" style={{ color: "var(--col-dim)" }}>
          Execucoes
        </p>
        <h1
          className="text-xl font-extrabold flex items-center gap-2"
          style={{ color: "var(--col-heading)", letterSpacing: "-0.03em" }}
        >
          Listagem
          {total > 0 && (
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: "linear-gradient(135deg,#DBEAFE,#EFF6FF)",
                color: "#2563EB",
                border: "1px solid rgba(147,197,253,0.4)",
              }}
            >
              {total}
            </span>
          )}
        </h1>
      </div>

      <button
        className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
        style={{
          background: "linear-gradient(135deg,#2563EB,#3B82F6)",
          boxShadow: "0 2px 10px rgba(37,99,235,0.25)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "linear-gradient(135deg,#1D4ED8,#2563EB)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "linear-gradient(135deg,#2563EB,#3B82F6)";
          e.currentTarget.style.transform = "none";
        }}
      >
        <Play size={14} aria-hidden="true" />
        Nova Execucao
      </button>
    </div>
  );
}
