"use client";

// =============================================================================
// Modais de confirmação: Arquivar e Excluir projeto
// Seguem o padrão glassmorphism com overlay escuro e card centralizado.
// =============================================================================

import { useState } from "react";
import type { ProjectList } from "@/lib/api/projects";

interface ArchiveModalProps {
  project: ProjectList;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ArchiveModal({ project, onConfirm, onCancel }: ArchiveModalProps) {
  return (
    <Overlay>
      <div className="w-full max-w-sm p-6 rounded-2xl text-center space-y-4" style={{
        background: "var(--glass-card-bg)", backdropFilter: "blur(24px)",
        border: "1px solid var(--glass-card-border)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div className="text-4xl">📦</div>
        <h2 className="text-lg font-extrabold" style={{ color: "var(--col-heading)" }}>Arquivar Projeto?</h2>
        <p className="text-sm" style={{ color: "var(--col-muted)" }}>
          <strong style={{ color: "var(--col-body)" }}>{project.name}</strong> não aparecerá mais em listagens e não poderá receber novos testes.
        </p>
        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ border: "1px solid rgba(226,232,240,0.7)", color: "var(--col-muted)", background: "transparent" }}>
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", boxShadow: "0 2px 10px rgba(245,158,11,0.3)" }}>
            Arquivar
          </button>
        </div>
      </div>
    </Overlay>
  );
}

interface DeleteModalProps {
  project: ProjectList;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteModal({ project, onConfirm, onCancel }: DeleteModalProps) {
  const [typed, setTyped] = useState("");
  const canDelete = typed === project.name;

  return (
    <Overlay>
      <div className="w-full max-w-sm p-6 rounded-2xl space-y-4" style={{
        background: "var(--glass-card-bg)", backdropFilter: "blur(24px)",
        border: "1px solid var(--glass-card-border)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div className="text-4xl text-center">⚠️</div>
        <h2 className="text-lg font-extrabold text-center" style={{ color: "var(--col-heading)" }}>Excluir Projeto?</h2>
        <p className="text-sm text-center" style={{ color: "var(--col-muted)" }}>
          Essa ação é irreversível. Todos os dados de <strong style={{ color: "var(--col-body)" }}>{project.name}</strong> serão removidos.
        </p>
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--col-label)" }}>Digite o nome do projeto para confirmar:</p>
          <input value={typed} onChange={(e) => setTyped(e.target.value)}
            placeholder={project.name} className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm" />
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ border: "1px solid rgba(226,232,240,0.7)", color: "var(--col-muted)", background: "transparent" }}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={!canDelete}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: canDelete ? "linear-gradient(135deg,#EF4444,#DC2626)" : "rgba(241,245,249,0.5)",
              color: canDelete ? "white" : "var(--col-dim)",
              cursor: canDelete ? "pointer" : "not-allowed",
            }}>
            Excluir
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// Modal simples de exclusão — sem campo de confirmação por digitação.
// Usado para itens de menor peso (casos de teste, ambientes, etc.)
interface SimpleDeleteModalProps {
  title: string;        // ex: "Excluir Caso de Teste?"
  description: string;  // ex: "TC-001 — Login com credenciais válidas"
  onConfirm: () => void;
  onCancel: () => void;
}

export function SimpleDeleteModal({ title, description, onConfirm, onCancel }: SimpleDeleteModalProps) {
  return (
    <Overlay>
      <div className="w-full max-w-sm p-6 rounded-2xl text-center space-y-4" style={{
        background: "var(--glass-card-bg)", backdropFilter: "blur(24px)",
        border: "1px solid var(--glass-card-border)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-extrabold" style={{ color: "var(--col-heading)" }}>{title}</h2>
        <p className="text-sm" style={{ color: "var(--col-muted)" }}>
          Essa ação é <strong style={{ color: "#EF4444" }}>irreversível</strong>. O item será excluído permanentemente:
        </p>
        <p className="text-sm font-semibold px-4 py-2.5 rounded-xl"
          style={{ background: "rgba(254,226,226,0.4)", color: "var(--col-body)", border: "1px solid rgba(252,165,165,0.3)" }}>
          {description}
        </p>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ border: "1px solid rgba(226,232,240,0.7)", color: "var(--col-muted)", background: "transparent" }}>
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)", boxShadow: "0 2px 10px rgba(239,68,68,0.3)" }}>
            Excluir
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// Overlay escuro com blur
function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
      {children}
    </div>
  );
}
