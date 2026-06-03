import * as React from "react";

import { cn } from "@/lib/utils";

// =============================================================================
// CONCEITO 1: Extendendo props HTML com props customizadas
//
// React.InputHTMLAttributes<HTMLInputElement> → todas as props nativas de
// um <input>: type, placeholder, disabled, value, onChange, onBlur, etc.
//
// extends adiciona 3 props customizadas no topo das nativas:
//   error?        → mensagem de erro a exibir abaixo do input
//   startContent? → elemento (ícone) dentro do input no lado esquerdo
//   endContent?   → elemento (ícone/botão) dentro do input no lado direito
//
// React.ReactNode = tipo de "qualquer coisa renderizável" — permite passar
// um ícone SVG, um componente ou qualquer JSX válido.
//
// Com isso, <Input> aceita tanto:
//   <Input placeholder="email" />               ← prop nativa
//   <Input error="Campo obrigatório" />          ← prop customizada
//   <Input startContent={<User />} />            ← prop customizada com JSX
// =============================================================================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}

// =============================================================================
// CONCEITO 2: forwardRef no Input — por que é importante
//
// react-hook-form usa refs para controlar os inputs sem useState.
// Quando você escreve {...register("username")}, um dos props injetados
// é um ref. Sem forwardRef, o ref seria perdido no componente customizado
// e o react-hook-form não conseguiria ler o valor do campo.
//
// Por isso todo componente de input de design system usa forwardRef.
// =============================================================================
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, startContent, endContent, ...props }, ref) => {
    return (
      <div className="w-full">
        {/* Wrapper relativo apenas do input + ícones — erro fica fora desse contexto */}
        <div className="relative">
          {startContent && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {startContent}
            </div>
          )}

          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              startContent && "pl-9",
              endContent && "pr-9",
              error && "border-destructive focus-visible:ring-destructive",
              className,
            )}
            ref={ref}
            {...props}
          />

          {endContent && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {endContent}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
