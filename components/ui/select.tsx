"use client";

// =============================================================================
// Select — wrapper estilizado em cima do @radix-ui/react-select.
//
// Por que Radix em vez de <select> nativo?
//   - O dropdown nativo do navegador NÃO pode ser estilizado (é desenhado pelo OS).
//   - Radix entrega a mecânica (teclado, foco, ARIA, posicionamento) — nós
//     escolhemos o visual via Tailwind + as CSS vars do glassmorphism.
//
// API (shadcn-style):
//   <Select value={v} onValueChange={setV}>
//     <SelectTrigger placeholder="Escolha..." />
//     <SelectContent>
//       <SelectItem value="a">Opção A</SelectItem>
//       <SelectItem value="b">Opção B</SelectItem>
//     </SelectContent>
//   </Select>
// =============================================================================

import * as React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Root + Value re-exportados direto do Radix
export const Select       = RadixSelect.Root;
export const SelectValue  = RadixSelect.Value;
export const SelectGroup  = RadixSelect.Group;

// ── Trigger (o "botão" do select) ───────────────────────────────────────────
interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof RadixSelect.Trigger> {
  placeholder?: string;
  error?: string;
}

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Trigger>,
  SelectTriggerProps
>(({ className, placeholder, error, children, ...props }, ref) => {
  // Trigger NÃO recebe w-full por padrão — quem decide a largura é o pai
  // (assim selects em flex/grid não estouram a linha).
  const trigger = (
    <RadixSelect.Trigger
      ref={ref}
      className={cn(
        "flex h-10 items-center justify-between gap-2 rounded-xl px-3.5 py-2",
        "text-sm transition-colors outline-none",
        "border data-[placeholder]:text-[color:var(--col-dim)]",
        "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-red-400 focus:ring-red-500/20 focus:border-red-500",
        className,
      )}
      style={{
        background: "var(--glass-card-bg)",
        backdropFilter: "blur(12px)",
        borderColor: "var(--glass-inner-border)",
        color: "var(--col-body)",
      }}
      {...props}
    >
      {children ?? <SelectValue placeholder={placeholder} />}
      <RadixSelect.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-60" />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
  );

  // Só envolve em <div> quando precisa empilhar a mensagem de erro
  if (!error) return trigger;
  return (
    <div className="w-full">
      {trigger}
      <p className="mt-1 text-xs text-red-500">{error}</p>
    </div>
  );
});
SelectTrigger.displayName = "SelectTrigger";

// ── Content (o painel flutuante com as opções) ──────────────────────────────
export const SelectContent = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Content>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <RadixSelect.Portal>
    <RadixSelect.Content
      ref={ref}
      position={position}
      sideOffset={6}
      className={cn(
        "z-[9999] min-w-[--radix-select-trigger-width] overflow-hidden rounded-xl",
        "shadow-[0_20px_60px_rgba(0,0,0,0.18)]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "bg-white border border-[rgba(186,210,235,0.7)]",
        "dark:bg-[#0D1323] dark:border-[rgba(51,65,85,0.7)]",
        className,
      )}
      {...props}
    >
      <RadixSelect.Viewport className="p-1.5">
        {children}
      </RadixSelect.Viewport>
    </RadixSelect.Content>
  </RadixSelect.Portal>
));
SelectContent.displayName = "SelectContent";

// ── Item (cada opção) ───────────────────────────────────────────────────────
export const SelectItem = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Item>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(({ className, children, ...props }, ref) => (
  <RadixSelect.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center",
      "rounded-lg px-3 py-2 pr-8 text-sm outline-none transition-colors",
      "text-[color:var(--col-body)]",
      "data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700",
      "dark:data-[highlighted]:bg-blue-500/15 dark:data-[highlighted]:text-blue-300",
      "data-[state=checked]:font-semibold data-[state=checked]:text-blue-700",
      "dark:data-[state=checked]:text-blue-300",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    <RadixSelect.ItemIndicator className="absolute right-2 flex h-4 w-4 items-center justify-center">
      <Check className="h-4 w-4" />
    </RadixSelect.ItemIndicator>
  </RadixSelect.Item>
));
SelectItem.displayName = "SelectItem";

// ── Label / Separator (opcionais, para agrupar) ─────────────────────────────
export const SelectLabel = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Label>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Label>
>(({ className, ...props }, ref) => (
  <RadixSelect.Label
    ref={ref}
    className={cn("px-3 py-1.5 text-xs font-semibold uppercase tracking-wide", className)}
    style={{ color: "var(--col-dim)" }}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

export const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Separator>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Separator>
>(({ className, ...props }, ref) => (
  <RadixSelect.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px", className)}
    style={{ background: "var(--glass-inner-border)" }}
    {...props}
  />
));
SelectSeparator.displayName = "SelectSeparator";
