"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";

/**
 * Página de erro padrão do aplicativo MedHub.
 * Exibida quando ocorrem erros recuperáveis.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log do erro para serviços de monitoramento
    console.error("Error caught by error boundary:", error);
  }, [error]);

  const handleGoHome = () => {
    // Redireciona para a página principal do sistema ou login
    router.push("/sistema");
  };

  const handleTryAgain = () => {
    reset();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="h-14 w-14 text-destructive" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">
              Ops! Algo deu errado.
            </h1>
            <p className="text-muted-foreground">
              Ocorreu um erro inesperado em nosso sistema.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Detalhes do erro (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === "development" && (
            <div className="rounded-lg bg-gray-100 p-3 text-left dark:bg-gray-700/50">
              <h3 className="mb-2 font-semibold text-red-600 dark:text-red-400">
                Detalhes Técnicos:
              </h3>
              <code className="block break-all text-xs text-gray-600 dark:text-gray-300">
                {error.message}
              </code>
              {error.digest && (
                <p className="mt-2 text-xs text-gray-500">
                  ID do Erro: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Ações recomendadas */}
          <div className="rounded-lg bg-muted p-3 text-left">
            <h3 className="mb-2 font-semibold">
              O que você pode fazer?
            </h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Tente novamente a ação que causou o erro.</li>
              <li>• Se o erro persistir, tente recarregar a página.</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            className="w-full font-bold"
            size="lg"
            onClick={handleTryAgain}
          >
            Tentar Novamente
          </Button>
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleGoHome}
            >
              <Home className="mr-2 h-4 w-4" />
              Página Inicial
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recarregar
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
