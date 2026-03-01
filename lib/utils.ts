import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// =============================================================================
// cn() — a função mais usada no projeto
//
// Resolve dois problemas que aparecem juntos ao usar Tailwind + componentes:
//
// PROBLEMA 1 — Classes condicionais (resolvido pelo clsx):
//   Você quer adicionar classes dependendo de condições:
//     cn("base", isError && "text-red-500", isDisabled && "opacity-50")
//   O clsx filtra os valores falsy (false, null, undefined) e retorna
//   só as classes válidas como uma string.
//
// PROBLEMA 2 — Conflito entre classes Tailwind (resolvido pelo twMerge):
//   Se você fizer: cn("px-4", "px-8")
//   Sem twMerge, o CSS final seria "px-4 px-8" — e a ordem no CSS da
//   Tailwind (não no className!) decide qual vence. Comportamento imprevisível.
//   Com twMerge: "px-8" — a última declaração vence, sempre.
//
//   Isso é crítico nos componentes como Card e Button:
//     <Card className="p-2" />  → o componente tem "p-6" interno
//     sem twMerge: "p-6 p-2" → qual vence? depende da ordem no CSS
//     com twMerge: "p-2"     → o className externo sempre sobrescreve
//
// ...inputs: ClassValue[] → aceita qualquer número de argumentos:
//   cn("a", "b")
//   cn("a", condition && "b", ["c", "d"])
//   cn({ "text-red": isError, "text-green": isSuccess })
// =============================================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
