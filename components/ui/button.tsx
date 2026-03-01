import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// =============================================================================
// CONCEITO 1: cva — Class Variance Authority
//
// cva é uma função que gerencia variantes de classes Tailwind.
// O problema que resolve: como ter um Button com variantes (default, outline,
// destructive...) sem um if/else gigante de classes CSS?
//
// cva(classesBase, { variants: { nomeVariante: { nomeOpcao: "classes" } } })
//
// Paralelo: é como um dict de configuração por variante no Django:
//   BUTTON_STYLES = {
//       "default": "bg-primary text-white ...",
//       "outline": "border border-input ...",
//   }
//
// O resultado: buttonVariants({ variant: "outline", size: "lg" })
// retorna a string de classes correta para aquela combinação.
// =============================================================================
const buttonVariants = cva(
  // Classes BASE — aplicadas em TODAS as variantes
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      // Variante "variant" → estilo visual do botão
      variant: {
        default:     "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:     "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:   "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost:       "hover:bg-accent hover:text-accent-foreground",
        link:        "text-primary underline-offset-4 hover:underline",
      },
      // Variante "size" → tamanho do botão
      size: {
        default: "h-9 px-4 py-2",
        sm:      "h-8 rounded-md px-3 text-xs",
        lg:      "h-10 rounded-md px-8",
        icon:    "h-9 w-9", // quadrado — para botões com só ícone
      },
    },
    // Valores padrão quando as variantes não são passadas explicitamente
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// =============================================================================
// CONCEITO 2: Extendendo props HTML nativas com TypeScript
//
// React.ButtonHTMLAttributes<HTMLButtonElement> → todas as props nativas
// de um <button>: onClick, type, disabled, form, aria-label, etc.
//
// VariantProps<typeof buttonVariants> → tipos das variantes do cva:
//   variant?: "default" | "destructive" | "outline" | ...
//   size?: "default" | "sm" | "lg" | "icon"
//
// extends combina tudo: ButtonProps tem as props nativas + as variantes.
// Isso permite usar: <Button onClick={...} variant="outline" size="lg" />
// =============================================================================
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;   // Radix Slot — explicado abaixo
  isLoading?: boolean; // prop customizada: mostra spinner e desabilita
}

// =============================================================================
// CONCEITO 3: React.forwardRef — passando refs para elementos HTML
//
// Refs permitem acessar o DOM diretamente (ex: focar um input, medir altura).
// Por padrão, você não pode passar refs para componentes customizados.
// forwardRef "encaminha" o ref para o elemento HTML interno.
//
// Sintaxe: React.forwardRef<TipoDoRef, TipodasProps>((props, ref) => JSX)
//   TipoDoRef → HTMLButtonElement (o elemento que receberá o ref)
//   props     → todas as props do componente
//   ref       → o ref a ser repassado para o <button>/<Comp> interno
//
// Paralelo: é transparente para o usuário — ele usa <Button ref={myRef} />
// e o ref aponta para o <button> real no DOM.
// =============================================================================
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {

    // ==========================================================================
    // CONCEITO 4: Radix Slot — o padrão "asChild"
    //
    // asChild permite que o Button "empreste" seus estilos para outro elemento.
    //
    // Sem asChild: <Button href="/link">texto</Button>
    //   → renderiza um <button> com href (inválido no HTML)
    //
    // Com asChild: <Button asChild><Link href="/link">texto</Link></Button>
    //   → renderiza um <Link> com os estilos do Button (correto!)
    //
    // O Slot pega os estilos/props do Button e aplica no filho direto.
    // É muito usado para botões que são links: <Button asChild><Link...>
    // ==========================================================================
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        // cn() combina as classes do cva com as className extras passadas
        className={cn(buttonVariants({ variant, size, className }))}
        // disabled é true se explicitamente desabilitado OU se está carregando
        disabled={disabled || isLoading}
        ref={ref}
        {...props} // repassa todos os outros props (onClick, type, aria-*, etc.)
      >
        {/*
          Se isLoading=true: mostra spinner animado + texto original
          Se isLoading=false: mostra só o children normalmente

          O SVG é um círculo com um arco — padrão de spinner CSS (animate-spin).
        */}
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);

// displayName: nome que aparece no React DevTools para identificar o componente.
// Necessário quando usamos forwardRef (que é uma função anônima).
Button.displayName = "Button";

export { Button, buttonVariants };
