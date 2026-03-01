"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Página de erro global crítico do MedHub.
 * Exibida quando ocorre um erro que impede o funcionamento da aplicação.
 * Esta página é autocontida e não depende do layout raiz.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro crítico para serviços de monitoramento
    console.error("Critical error caught by global error boundary:", error);
  }, [error]);

  const handleReload = () => {
    window.location.href = "/";
  };

  const handleTryAgain = () => {
    reset();
  };

  return (
    <html lang="pt-br">
      <body className="min-h-screen bg-gray-100 font-sans text-gray-800 antialiased">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 text-center shadow-xl">
            {/* Cabeçalho */}
            <div className="flex flex-col items-center gap-4">
              <AlertTriangle className="h-16 w-16 text-red-500" />
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  Erro Crítico no Sistema
                </h1>
                <p className="text-gray-600">
                  O MedHub encontrou um problema inesperado e precisa ser
                  reiniciado.
                </p>
              </div>
            </div>

            {/* Detalhes do erro (apenas em desenvolvimento) */}
            {process.env.NODE_ENV === "development" && (
              <div className="rounded-lg bg-gray-100 p-3 text-left">
                <h3 className="mb-2 font-semibold text-red-600">
                  Detalhes Técnicos:
                </h3>
                <code className="block break-all text-xs text-gray-600">
                  {error.message}
                </code>
              </div>
            )}

            {/* Ações */}
            <div className="space-y-3 pt-4">
              <p className="text-sm font-medium text-gray-700">
                Para sua segurança, recomendamos reiniciar a aplicação.
              </p>
              <button
                className="w-full rounded-md bg-red-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                type="button"
                onClick={handleReload}
              >
                Reiniciar Sistema
              </button>
              <button
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                type="button"
                onClick={handleTryAgain}
              >
                Tentar Novamente (Avançado)
              </button>
            </div>

            {/* Suporte */}
            <div className="border-t border-gray-200 pt-6">
              <p className="text-xs text-gray-500">
                Se o problema persistir, por favor, entre em contato com o
                suporte técnico. Pedimos desculpas pelo inconveniente.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
