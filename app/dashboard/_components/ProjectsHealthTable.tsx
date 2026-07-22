// =============================================================================
// ProjectsHealthTable — Faixa 2: saúde de todos os projetos de um olhar
//
// Cada linha responde, por projeto: a última run passou? há quanto tempo?
// qual a taxa agregada do período? quantas falhas/flaky acumulou?
//
// Esta faixa só aparece quando o filtro é "Todos os projetos" — com um
// projeto selecionado ela seria uma tabela de 1 linha (o DashboardClient
// decide isso, não este componente; ele só renderiza o que recebe).
// =============================================================================

import Link from "next/link";
import type { ProjectHealth } from "@/lib/api/metrics";

interface ProjectsHealthTableProps {
  projects: ProjectHealth[];
}

// "há 2h", "há 5min", "há 3d" — tempo relativo curto para a coluna Última Run
function tempoRelativo(iso: string | null): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min}min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `há ${horas}h`;
  return `há ${Math.floor(horas / 24)}d`;
}

// Bolinha de status: verde = ok, vermelho = falhou, âmbar = em andamento
const COR_STATUS: Record<string, { cor: string; rotulo: string }> = {
  COMPLETED: { cor: "#16a34a", rotulo: "Concluída" },
  FAILED:    { cor: "#dc2626", rotulo: "Falhou" },
  PENDING:   { cor: "#ca8a04", rotulo: "Rodando" },   // pendente = em andamento no Hub
  RUNNING:   { cor: "#ca8a04", rotulo: "Rodando" },
  CANCELLED: { cor: "#9ca3af", rotulo: "Cancelada" },
};

export function ProjectsHealthTable({ projects }: ProjectsHealthTableProps) {
  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wide mb-3">
        Saúde dos Projetos
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-700">
              <th className="pb-2 font-medium">Projeto</th>
              <th className="pb-2 font-medium">Última Run</th>
              <th className="pb-2 font-medium w-44">Taxa do Período</th>
              <th className="pb-2 font-medium text-center">Falhas</th>
              <th className="pb-2 font-medium text-center">Flaky</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const status = p.last_run_status ? COR_STATUS[p.last_run_status] : null;
              return (
                <tr key={p.id} className="border-b border-gray-50 dark:border-slate-700/50 last:border-0">
                  {/* Nome → navega para o detalhe do projeto */}
                  <td className="py-2.5 pr-3">
                    <Link
                      href={`/dashboard/projetos/${p.id}`}
                      className="font-medium text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {p.name}
                    </Link>
                  </td>

                  {/* Última run: bolinha de status + tempo relativo */}
                  <td className="py-2.5 pr-3 whitespace-nowrap">
                    {status ? (
                      <span className="flex items-center gap-1.5 text-gray-600 dark:text-slate-300">
                        <span
                          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: status.cor }}
                          title={status.rotulo}
                        />
                        {p.last_run_status === "FAILED" && (
                          <span className="text-xs font-semibold" style={{ color: status.cor }}>FALHOU</span>
                        )}
                        <span className="text-xs text-gray-400 dark:text-slate-500">
                          {tempoRelativo(p.last_run_at)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-slate-500">sem execuções</span>
                    )}
                  </td>

                  {/* Mini barra de progresso da taxa — largura = percentual */}
                  <td className="py-2.5 pr-3">
                    {p.success_rate !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${p.success_rate}%`,
                              background: p.success_rate >= 80 ? "#16a34a" : p.success_rate >= 60 ? "#ca8a04" : "#dc2626",
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 dark:text-slate-300 w-10 text-right">
                          {p.success_rate.toFixed(0)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-slate-500">—</span>
                    )}
                  </td>

                  {/* Contadores — vermelho/âmbar só quando > 0 */}
                  <td className="py-2.5 text-center font-semibold" style={{ color: p.failures > 0 ? "#dc2626" : "#9ca3af" }}>
                    {p.failures}
                  </td>
                  <td className="py-2.5 text-center font-semibold" style={{ color: p.flaky > 0 ? "#ca8a04" : "#9ca3af" }}>
                    {p.flaky}
                  </td>
                </tr>
              );
            })}

            {projects.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-gray-400 dark:text-slate-500">
                  Nenhum projeto ativo
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
