// =============================================================================
// CONCEITO 3: Renderização de listas com .map()
//
// .map() transforma um array de dados em um array de JSX.
// É o {% for item in lista %} do Django, mas retorna elementos React.
//
// REGRA OBRIGATÓRIA: todo elemento de lista precisa de key único.
// O React usa o key para saber qual item mudou e re-renderizar só ele.
// Sem key, o React re-renderiza toda a lista a cada mudança.
//
// Aqui: key={item.name} — funciona pois nomes de teste são únicos.
// Na API real: key={item.id} é mais seguro (IDs são garantidamente únicos).
// =============================================================================

import { AlertCircle } from "lucide-react";

export interface FailureItem {
  name: string;   // título do caso de teste
  count: number;  // total de falhas recentes
}

interface TopFailuresCardProps {
  failures: FailureItem[];
}

export function TopFailuresCard({ failures }: TopFailuresCardProps) {
  const MAX_ITEMS = 5;

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      {/* Cabeçalho com ícone de alerta */}
      <div className="flex items-center gap-2">
        <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Top Falhas Recorrentes
        </span>
      </div>

      {/* Lista — slice(0, MAX_ITEMS) limita a 5 itens mesmo que venham mais */}
      <ul className="space-y-2.5 flex-1">
        {failures.slice(0, MAX_ITEMS).map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-2">
            {/*
              title={item.name}: quando o texto é cortado pelo truncate,
              o usuário pode ver o nome completo no tooltip nativo do browser.
              Paralelo HTML: é o mesmo atributo title de sempre.
            */}
            <p className="text-sm text-gray-700 truncate flex-1" title={item.name}>
              {item.name}
            </p>

            {/* Badge contador de falhas */}
            <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
              {item.count}x
            </span>
          </li>
        ))}

        {/* Estado vazio — rendered quando não há falhas */}
        {failures.length === 0 && (
          <li className="text-sm text-gray-400 text-center py-6">
            Nenhuma falha registrada
          </li>
        )}
      </ul>
    </div>
  );
}
