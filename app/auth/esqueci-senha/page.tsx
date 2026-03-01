"use client";

import React, { useState } from "react";
import { Mail, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/icons";
import { ThemeSwitcher } from "@/components/common/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const { isLoading } = useAuthStore();
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage("Por favor, insira seu email.");
      setIsSuccess(false);

      return;
    }
    setMessage("");
    try {
      // TODO: chamar endpoint de reset de senha do backend
      setMessage(
        "Instruções de redefinição de senha foram enviadas para seu email.",
      );
      setIsSuccess(true);
      setEmail("");
    } catch {
      setMessage("Erro ao processar solicitação. Tente novamente.");
      setIsSuccess(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-6 right-8">
        <ThemeSwitcher />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center justify-center gap-2 text-center">
          <Logo size={80} />
          <h1 className="text-2xl font-bold mt-4">Recuperar Acesso</h1>
          <p className="text-sm text-muted-foreground">
            Informe seu e-mail para receber o link de redefinição de senha.
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-2">
            {!isSuccess && (
              <>
                <div className="space-y-2">
                  <label
                    className="block text-sm font-medium"
                    htmlFor="email"
                  >
                    Enviar link por e-mail
                  </label>
                  <Input
                    autoComplete="email"
                    disabled={isLoading}
                    id="email"
                    placeholder="seu.email@instituicao.com.br"
                    startContent={
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    }
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full font-bold"
                  disabled={isLoading}
                  isLoading={isLoading}
                  type="submit"
                >
                  {isLoading ? "Enviando..." : "Enviar Link de Recuperação"}
                </Button>
              </>
            )}

            {message && (
              <div
                className={`flex items-center gap-3 text-sm px-4 py-3 rounded-md border ${
                  isSuccess
                    ? "bg-green-100/70 border-green-400/50 text-green-800 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700/60"
                    : "bg-red-100/70 border-red-400/50 text-red-800 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700/60"
                }`}
              >
                {isSuccess ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
                <p className="font-medium">{message}</p>
              </div>
            )}
          </CardContent>
        </form>

        <CardFooter className="flex justify-center pt-2">
          <Link
            className="font-semibold text-primary hover:underline text-sm"
            href="/auth/login"
          >
            Lembrou a senha? Voltar para o Login
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
