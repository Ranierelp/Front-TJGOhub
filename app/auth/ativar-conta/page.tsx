"use client";

import React from "react";
import { MailCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/common/ThemeSwitcher";

export default function PendingActivationPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background transition-colors duration-300">
      <div className="absolute top-6 right-8">
        <ThemeSwitcher />
      </div>

      <Card className="w-full max-w-md text-center">
        <CardHeader className="flex flex-col items-center justify-center gap-4">
          <MailCheck className="w-14 h-14 text-primary" />
          <h1 className="text-3xl font-bold">Confirme seu E-mail</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Sua conta foi criada com sucesso!
          </p>
          <p className="font-medium text-justify">
            Enviamos um link de ativação para o seu endereço de e-mail. Por
            favor, verifique sua caixa de entrada (e a pasta de spam) para
            ativar sua conta.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full font-bold" size="lg">
            <Link href="/auth/login">Voltar para o Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
