"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  LockKeyhole,
} from "lucide-react";
import Link from "next/link";

import { passwordSchema, type PasswordFormData } from "@/lib/validators";
import { Logo } from "@/components/icons";
import { ThemeSwitcher } from "@/components/common/ThemeSwitcher";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function MudarSenhaPage() {
  const [isCurrentVisible, setIsCurrentVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const { isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (_data: PasswordFormData) => {
    setMessage("");
    try {
      // TODO: chamar endpoint de mudanÃ§a de senha do backend
      setMessage("Senha alterada com sucesso!");
      setIsSuccess(true);
      reset();
    } catch {
      setMessage("Erro ao alterar senha. Tente novamente.");
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
          <h1 className="text-2xl font-bold mt-4">Alterar Senha</h1>
          <p className="text-sm text-muted-foreground">
            Para sua seguranÃ§a, informe sua senha atual antes de definir uma
            nova.
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5 pt-6">
            <Input
              {...register("currentPassword")}
              autoComplete="current-password"
              endContent={
                <button
                  className="focus:outline-none text-muted-foreground hover:text-foreground"
                  type="button"
                  onClick={() => setIsCurrentVisible(!isCurrentVisible)}
                >
                  {isCurrentVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.currentPassword?.message}
              placeholder="Senha Atual"
              startContent={
                <LockKeyhole className="h-4 w-4 text-muted-foreground" />
              }
              type={isCurrentVisible ? "text" : "password"}
            />
            <Input
              {...register("newPassword")}
              autoComplete="new-password"
              endContent={
                <button
                  className="focus:outline-none text-muted-foreground hover:text-foreground"
                  type="button"
                  onClick={() => setIsVisible(!isVisible)}
                >
                  {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.newPassword?.message}
              placeholder="Nova Senha"
              startContent={
                <LockKeyhole className="h-4 w-4 text-muted-foreground" />
              }
              type={isVisible ? "text" : "password"}
            />
            <Input
              {...register("confirmPassword")}
              autoComplete="new-password"
              endContent={
                <button
                  className="focus:outline-none text-muted-foreground hover:text-foreground"
                  type="button"
                  onClick={() => setIsConfirmVisible(!isConfirmVisible)}
                >
                  {isConfirmVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.confirmPassword?.message}
              placeholder="Confirmar Nova Senha"
              startContent={
                <LockKeyhole className="h-4 w-4 text-muted-foreground" />
              }
              type={isConfirmVisible ? "text" : "password"}
            />

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

          <CardFooter className="flex flex-col gap-4 pt-6">
            <Button
              className="w-full font-bold"
              isLoading={isSubmitting || isLoading}
              type="submit"
            >
              {isSubmitting || isLoading ? "Alterando..." : "Alterar Senha"}
            </Button>
            <Link
              className="font-semibold text-primary hover:underline text-sm"
              href="/sistema"
            >
              Voltar a pÃ¡gina principal
            </Link>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
