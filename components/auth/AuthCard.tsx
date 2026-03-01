// =============================================================================
// CONCEITO: Componente de layout compartilhado
//
// Tanto o login quanto o registro têm o mesmo "casca" visual:
//   • Fundo com gradiente azul
//   • Dois círculos decorativos semi-transparentes
//   • Card branco com sombra forte
//   • Header do card com gradiente azul, escudo, "TJGO" e subtítulo
//
// Em vez de duplicar esse HTML nos dois arquivos, criamos um componente
// que aceita o conteúdo variável via "children" e "footer".
//
// Paralelo Django: é como um bloco {% block content %} no base.html —
// a "casca" é fixa, só o miolo muda.
// =============================================================================

import React from "react";
import { Shield } from "lucide-react";

// Props do componente:
//   subtitle → texto do subtítulo no header ("Playwright Results Hub" | "Criar nova conta")
//   children → o formulário da página
//   footer   → o link de "Já tem uma conta?" ou "Não tem uma conta?"
//   wide     → o card de registro é um pouco mais largo (460px vs 420px)
interface AuthCardProps {
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  wide?: boolean;
}

export function AuthCard({ subtitle, children, footer, wide = false }: AuthCardProps) {
  return (
    // Fundo: gradiente azul diagonal — igual ao auth.css do Django
    // "relative" porque os círculos usam "fixed" para cobrir a tela toda
    <main
      className="relative flex items-center justify-center min-h-screen p-4"
      style={{ background: "linear-gradient(145deg, #2d5fa8 0%, #4a8fd4 50%, #3a7bc8 100%)" }}
    >
      {/* Círculo decorativo — canto superior esquerdo */}
      <div
        className="pointer-events-none fixed top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)" }}
      />
      {/* Círculo decorativo — canto inferior direito */}
      <div
        className="pointer-events-none fixed bottom-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)" }}
      />

      {/* Card branco com sombra forte — animate-slide-up vem do globals.css */}
      <div
        className={`relative bg-white rounded-2xl overflow-hidden w-full animate-slide-up ${wide ? "max-w-[460px]" : "max-w-[420px]"}`}
        style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.15)" }}
      >
        {/* Header do card — gradiente azul igual ao .card-header do Django */}
        <div
          className="text-center px-8 py-7"
          style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" }}
        >
          {/* Ícone de escudo dentro de caixa semi-transparente */}
          <div
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-white text-xl font-bold tracking-wide">TJGO</h1>
          <p className="text-blue-100 text-sm mt-1">{subtitle}</p>
        </div>

        {/* Corpo do card — onde o formulário vai */}
        <div className="p-8">{children}</div>

        {/* Rodapé do card — separador + link de navegação */}
        <div className="px-8 pb-6 pt-4 border-t border-gray-100 text-center">
          {footer}
        </div>
      </div>
    </main>
  );
}
