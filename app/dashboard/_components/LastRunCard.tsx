// =============================================================================
// CONCEITO 1: Props com TypeScript — a "assinatura" do componente
//
// Em React, dados passam de pai → filho via props.
// Com TypeScript declaramos exatamente o que o componente espera receber,
// assim o editor avisa se você passar o tipo errado.
//
// Paralelo Django:
//   Python:  return render(request, 'last_run.html', {'run': run})
//   React:   <LastRunCard run={run} />
//
// A interface abaixo espelha os campos do endpoint GET /api/v1/runs/
// que este card usa. No Passo 6, os dados reais virão da API.
// =============================================================================

import { CheckCircle2, XCircle, Clock, ArrowRight } from "lucide-react";
import NextLink from "next/link";

// Campos do endpoint /api/v1/runs/ que este card precisa.
// Exportamos para o page.tsx poder usar o mesmo tipo nos dados mock.
export interface Run {
  id: string;
  project_name: string;
  environment_name: string;
  status: "COMPLETED" | "FAILED" | "RUNNING" | "PENDING" | "CANCELLED";
  started_at: string;         // ISO 8601: "2026-02-28T09:30:00Z"
  duration_formatted: string; // já formatado pelo backend: "3m 42s"
  success_rate: number;       // float 0-100
}

interface LastRunCardProps {
  run: Run;
}

// Configuração visual de cada status — centralizada aqui para não repetir
// a lógica no JSX. No Python seria um dict ou Enum.
const STATUS_CONFIG = {
  COMPLETED: { label: "Concluído",  Icon: CheckCircle2, color: "#16a34a", bg: "#dcfce7" },
  FAILED:    { label: "Falhou",     Icon: XCircle,      color: "#dc2626", bg: "#fee2e2" },
  RUNNING:   { label: "Executando", Icon: Clock,        color: "#2563eb", bg: "#dbeafe" },
  PENDING:   { label: "Aguardando", Icon: Clock,        color: "#64748b", bg: "#f1f5f9" },
  CANCELLED: { label: "Cancelado",  Icon: XCircle,      color: "#64748b", bg: "#f1f5f9" },
} as const;

// Converte "2026-02-28T09:30:00Z" → "28/02/2026 às 09:30"
// Paralelo Python: datetime.strftime('%d/%m/%Y às %H:%M')
function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function LastRunCard({ run }: LastRunCardProps) {
  const s = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.PENDING;

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      {/* Cabeçalho: título do card + badge de status */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Última Execução
        </span>
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ background: s.bg, color: s.color }}
        >
          <s.Icon size={11} />
          {s.label}
        </span>
      </div>

      {/* Dados do projeto */}
      <div>
        <p className="font-bold text-gray-900 text-base leading-tight">{run.project_name}</p>
        <p className="text-sm text-gray-500 mt-0.5">{run.environment_name}</p>
      </div>

      {/* Meta-dados: data, duração, taxa de sucesso */}
      <div className="text-xs text-gray-400 space-y-0.5">
        <p>{formatDate(run.started_at)}</p>
        <p>Duração: <span className="text-gray-600">{run.duration_formatted}</span></p>
        <p>
          Taxa de sucesso:{" "}
          <span className="font-semibold text-gray-700">{run.success_rate.toFixed(1)}%</span>
        </p>
      </div>

      {/* Link para detalhes — mt-auto empurra para o fundo do card */}
      <NextLink
        href={`/dashboard/execucoes/${run.id}`}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium mt-auto"
      >
        Ver detalhes <ArrowRight size={12} />
      </NextLink>
    </div>
  );
}
