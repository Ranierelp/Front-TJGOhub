"use client";

import { SearchX, Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

/**
 * Página 404 — Não Encontrado.
 */
export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader className="flex flex-col items-center gap-4">
          <SearchX className="h-16 w-16 text-primary" />
          <div className="space-y-1">
            <h1 className="text-5xl font-bold">404</h1>
            <h2 className="text-2xl font-semibold text-muted-foreground">
              Página Não Encontrada
            </h2>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-muted-foreground text-justify">
            Desculpe, não conseguimos encontrar a página que você está
            procurando. Verifique se o endereço foi digitado corretamente ou
            utilize os botões abaixo para retornar a uma área segura do sistema.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            className="w-full"
            size="lg"
            onClick={() => router.push("/sistema")}
          >
            <Home className="mr-2 h-5 w-5" />
            Ir para a Página Principal
          </Button>
          <Button
            className="w-full"
            size="lg"
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Voltar para a Página Anterior
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
