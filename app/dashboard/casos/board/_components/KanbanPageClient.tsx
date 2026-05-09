"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { CasePageBackground } from "@/app/dashboard/casos/_components/CaseShared";

export function KanbanPageClient() {
  const router = useRouter();

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <CasePageBackground />

      <div className="flex flex-col gap-5">

        {/* Cabeçalho da página */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--col-dim)" }}>
              Casos de Teste
            </p>
            <h1
              className="text-xl font-extrabold"
              style={{ color: "var(--col-heading)", letterSpacing: "-0.03em" }}
            >
              Board
            </h1>
          </div>
          <button
            onClick={() => router.push("/dashboard/casos/novo")}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: "linear-gradient(135deg,#2563EB,#3B82F6)",
              boxShadow:  "0 2px 10px rgba(37,99,235,0.25)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "linear-gradient(135deg,#1D4ED8,#2563EB)";
              e.currentTarget.style.transform  = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "linear-gradient(135deg,#2563EB,#3B82F6)";
              e.currentTarget.style.transform  = "none";
            }}
          >
            <Plus className="h-4 w-4" /> Novo Caso
          </button>
        </div>

        {/* Board — toolbar e colunas ficam dentro do KanbanBoard */}
        <KanbanBoard />

      </div>
    </div>
  );
}
