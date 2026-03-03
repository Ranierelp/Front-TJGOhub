"use client";
// =============================================================================
// CONCEITO: Componentes compartilhados (DRY no React)
//
// "use client" aqui porque Accordion usa useState.
//
// Paralelo Django:
//   Esses componentes são como templatetags ou inclusion_tags do Django —
//   pedaços de HTML reutilizáveis que você chama em vários templates.
//
//   {% include "partials/glass_card.html" %}  →  <GlassCard>...</GlassCard>
//
// ANTES: GlassCard estava definido separadamente em CreateCaseClient.tsx
//        E de novo (diferente) em CaseDetailClient.tsx
// AGORA: Definido UMA VEZ aqui, importado em ambos.
//
// Benefícios:
//   • Mudar o visual em um lugar reflete em todas as telas
//   • Mesmas proporções garantidas (não depende de cada dev lembrar o valor)
//   • Menos código para manter
// =============================================================================

import React, { useState } from "react";

// ── Tipos compartilhados ─────────────────────────────────────────────────────

// Props comuns: aceita React.ReactNode (qualquer coisa renderizável) + classe CSS opcional
type WithChildren = { children: React.ReactNode; className?: string };

// =============================================================================
// GlassCard — card branco semi-transparente com blur
//
// É o "container visual" padrão desta seção do sistema.
// Usado em CreateCaseClient, CaseDetailClient, e agora definido uma vez só.
// =============================================================================
export function GlassCard({ children, className = "" }: WithChildren) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background:           "var(--glass-card-bg)",
        backdropFilter:       "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border:               "1px solid var(--glass-card-border)",
        boxShadow:            "var(--glass-shadow)",
      }}
    >
      {children}
    </div>
  );
}

// =============================================================================
// SLabel — título de seção dentro de um GlassCard
//
// "S" de "Section Label". Azul, maiúsculas, com emoji decorativo.
// =============================================================================
export function SLabel({
  emoji,
  children,
}: {
  emoji?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {/* O "&&" é "renderização condicional" — só renderiza se emoji existir
          Equivalente Python: {{ emoji }} if emoji else ""
          Aqui: se emoji for undefined, o bloco inteiro não aparece no HTML */}
      {emoji && <span className="text-sm">{emoji}</span>}
      <span
        className="text-xs font-bold uppercase tracking-wider"
        style={{ color: "#3B82F6" }}
      >
        {children}
      </span>
    </div>
  );
}

// =============================================================================
// FLabel — label de campo de formulário
//
// "F" de "Field Label". Cinza, pequeno, com asterisco vermelho se obrigatório.
// =============================================================================
export function FLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      className="block text-xs font-semibold mb-1.5 tracking-wide"
      style={{ color: "var(--col-label)" }}
    >
      {children}
      {required && <span style={{ color: "#3B82F6" }}> *</span>}
    </label>
  );
}

// =============================================================================
// ErrMsg — mensagem de erro abaixo de um campo
//
// Retorna null se não houver mensagem — componente invisível.
// =============================================================================
export function ErrMsg({ msg }: { msg?: string }) {
  return msg ? (
    <p className="text-xs mt-1" style={{ color: "#EF4444" }}>
      {msg}
    </p>
  ) : null;
}

// =============================================================================
// Accordion — seção colapsável (abre/fecha ao clicar no título)
//
// CONCEITO NOVO: useState dentro de um componente filho
//
// Cada <Accordion> tem seu PRÓPRIO estado "open" — eles são independentes.
// Clicar em um Accordion não afeta os outros.
//
// Paralelo: é como cada <details>/<summary> do HTML nativo, mas com
// animação CSS (transition de maxHeight) que o <details> não tem.
//
// Paralelo Python: pense em cada instância do Accordion como um objeto
// de uma classe com seu próprio self.open — estados separados por instância.
// =============================================================================
export function Accordion({
  title,
  emoji,
  children,
  defaultOpen = false,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  // useState(false) = "começa fechado"
  // useState(true)  = "começa aberto"
  // defaultOpen permite controlar o padrão de fora do componente
  const [open, setOpen] = useState(defaultOpen);

  return (
    <GlassCard>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
      >
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
          style={{
            background:  open ? "linear-gradient(135deg,rgba(219,234,254,0.4),rgba(239,246,255,0.3))" : "var(--col-surface)",
            transition: "all 0.3s",
          }}
        >
          {emoji}
        </span>
        <span className="flex-1 text-sm font-semibold" style={{ color: "var(--col-body)" }}>
          {title}
        </span>
        <span
          style={{
            transform:  open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s",
            color:      "var(--col-dim)",
          }}
        >
          ▾
        </span>
      </button>

      {/* Animação de abrir/fechar via maxHeight + opacity
          maxHeight: "0" → "600px" cria o efeito de slide down sem height: auto */}
      <div
        style={{
          maxHeight:  open ? "600px" : "0",
          opacity:    open ? 1 : 0,
          overflow:   "hidden",
          transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease",
        }}
      >
        <div className="px-5 pb-4">{children}</div>
      </div>
    </GlassCard>
  );
}

// =============================================================================
// CasePageBackground — fundo animado compartilhado
//
// Usado em CaseListClient, CreateCaseClient, CaseDetailClient.
// Definido uma vez, usado em todos.
// =============================================================================
export function CasePageBackground() {
  return (
    <div className="fixed inset-0 -z-10" style={{ background: "var(--page-bg)" }}>
      <div
        className="absolute"
        style={{
          width: 600, height: 600, top: -100, right: -100,
          background:   "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          filter:       "blur(40px)",
          animation:    "float1 20s ease-in-out infinite",
        }}
      />
      <div
        className="absolute"
        style={{
          width: 500, height: 500, bottom: -50, left: -100,
          background:   "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
          borderRadius: "50%",
          filter:       "blur(40px)",
          animation:    "float2 25s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(148,163,184,0.12) 1px, transparent 1px)",
          backgroundSize:  "24px 24px",
        }}
      />
    </div>
  );
}
