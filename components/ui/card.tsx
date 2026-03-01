import * as React from "react";

import { cn } from "@/lib/utils";

// =============================================================================
// CONCEITO 1: Compound Components (Componentes Compostos)
//
// Em vez de um <Card> gigante com props para tudo (título, conteúdo, footer...),
// esse padrão divide o Card em partes menores e independentes:
//   <Card>          → container externo
//     <CardHeader>  → topo (título, descrição)
//     <CardContent> → conteúdo principal
//     <CardFooter>  → rodapé (botões, ações)
//   </Card>
//
// Você usa só as partes que precisa — composição em vez de configuração.
// Paralelo: é como os blocos de template do Django:
//   {% block header %}{% endblock %}
//   {% block content %}{% endblock %}
//   {% block footer %}{% endblock %}
//
// Mas aqui você decide quais blocos incluir em cada uso.
// =============================================================================

// =============================================================================
// CONCEITO 2: React.forwardRef + React.HTMLAttributes
//
// React.HTMLAttributes<HTMLDivElement> → todas as props nativas de uma <div>:
//   className, id, onClick, style, aria-*, data-*, children, etc.
//
// Ao estender HTMLAttributes, o Card aceita qualquer prop que uma <div> aceita,
// mais as que adicionarmos (como className customizado).
//
// O padrão { className, ...props } desestrutura className para combinar
// com as classes internas via cn(), e ...props repassa o resto para a <div>.
// =============================================================================

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      // cn() une as classes padrão do Card com as classes extras passadas via className
      // Se você usar <Card className="mt-4">, ele terá as classes do Card + mt-4
      className={cn("rounded-xl border border-border bg-card text-card-foreground shadow", className)}
      {...props} // repassa children, onClick, aria-label, id, etc.
    />
  ),
);
Card.displayName = "Card";

// CardHeader — área do topo com padding e espaçamento vertical entre filhos
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

// CardTitle — título do card com tipografia semibold
const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

// CardDescription — texto secundário abaixo do título
const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

// CardContent — área de conteúdo principal (padding lateral + inferior, sem topo)
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    // pt-0 remove o padding do topo — o CardHeader já tem padding inferior
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

// CardFooter — rodapé com itens alinhados em linha (flex row)
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

// =============================================================================
// CONCEITO 3: Named exports vs Default export
//
// Aqui exportamos vários componentes nomeados de um mesmo arquivo.
// O consumidor importa só o que precisa:
//   import { Card, CardHeader, CardContent } from "@/components/ui/card"
//
// Versus default export (um por arquivo):
//   import Card from "@/components/ui/card"
//
// Named exports são preferidos para "famílias" de componentes relacionados,
// como esses subcomponentes do Card.
// =============================================================================
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
