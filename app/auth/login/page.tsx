"use client";

// =============================================================================
// CONCEITO: Separação entre lógica e visual
//
// A lógica do formulário (useForm, zodResolver, onSubmit, useState)
// NÃO mudou — é exatamente a mesma do arquivo anterior.
//
// O que mudou: o JSX. Em vez de Card + CardHeader + CardContent genéricos,
// agora usamos AuthCard — que traz o visual idêntico ao Django monolito:
//   • Fundo azul com gradiente
//   • Card branco com header azul + escudo + "TJGO"
//   • Inputs com fundo cinza e foco azul
//   • Botão com gradiente azul
//
// Paralelo React: lógica (custom hooks + form) ≠ visual (JSX/CSS).
// Você pode trocar o visual sem tocar na lógica, e vice-versa.
// =============================================================================

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, User, AlertTriangle, LockKeyhole } from "lucide-react";
import Link from "next/link";

import { loginSchema, type LoginFormData } from "@/lib/validators";
import { useGuestRoute } from "@/hooks/useAuthGuard";
import { useAuthStore } from "@/stores/authStore";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

// Classe Tailwind reutilizada nos inputs — muda o visual para o estilo Django:
//   bg-gray-50       → fundo cinza claro (em vez de transparente)
//   border-gray-200  → borda cinza clara (em vez da variável CSS)
//   focus-visible:ring-blue-500 → anel de foco azul (em vez do verde/primário)
//   placeholder:text-gray-400   → placeholder mais apagado
const INPUT_CLASS =
  "bg-gray-50 border-gray-200 focus-visible:ring-blue-500 placeholder:text-gray-400";

export default function LoginPage() {
  const { redirectToSystem } = useGuestRoute();
  const { login, isLoading: authLoading } = useAuthStore();

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (attemptCount >= 5) {
      // Rate limit pode ser ativado aqui se necessário
    }
  }, [attemptCount]);

  const onSubmit = async (data: LoginFormData) => {
    if (isRateLimited) {
      setError("Muitas tentativas de login. Tente novamente em 5 minutos.");
      return;
    }
    setError("");
    try {
      const result = await login({ username: data.username, password: data.password });
      if (result.success) {
        redirectToSystem();
      } else {
        setError(result.message);
        setAttemptCount((prev) => prev + 1);
      }
    } catch (err: unknown) {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    }
  };

  // Estado de carregamento: mostra fundo azul + spinner (sem o card ainda)
  if (authLoading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{ background: "linear-gradient(145deg, #2d5fa8 0%, #4a8fd4 50%, #3a7bc8 100%)" }}
      >
        <Spinner size="lg" className="text-white" />
      </main>
    );
  }

  return (
    // AuthCard cuida do fundo + círculos + card + header com escudo.
    // Passamos subtitle, footer e o formulário como children.
    <AuthCard
      subtitle="Playwright Results Hub"
      footer={
        <p className="text-sm text-gray-500">
          Não tem uma conta?{" "}
          <Link href="/auth/registro" className="text-blue-600 hover:text-blue-800 font-medium">
            Criar conta
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Campo: usuário — label acima do input, igual ao Django */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="username">
            Usuário
          </label>
          <Input
            {...register("username")}
            id="username"
            autoComplete="email"
            className={INPUT_CLASS}
            disabled={isSubmitting || isRateLimited}
            error={errors.username?.message}
            placeholder="usuario@tjgo.jus.br"
            startContent={<User className="h-4 w-4 text-gray-400" />}
          />
        </div>

        {/* Campo: senha — label e link "Esqueci" na mesma linha, igual ao Django */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-medium text-gray-700" htmlFor="password">
              Senha
            </label>
            <Link
              href="/auth/esqueci-senha"
              className={`text-sm font-medium ${
                isRateLimited ? "pointer-events-none text-gray-400" : "text-blue-600 hover:text-blue-800"
              }`}
            >
              Esqueci minha senha
            </Link>
          </div>
          <Input
            {...register("password")}
            id="password"
            autoComplete="current-password"
            className={INPUT_CLASS}
            disabled={isSubmitting || isRateLimited}
            error={errors.password?.message}
            placeholder="••••••••"
            startContent={<LockKeyhole className="h-4 w-4 text-gray-400" />}
            type={showPassword ? "text" : "password"}
            endContent={
              <button
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="focus:outline-none text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        {/* Botão com gradiente azul — sobrescreve o verde primário do tema via style */}
        <Button
          type="submit"
          className="w-full font-semibold text-white border-0"
          style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" }}
          disabled={isSubmitting || isRateLimited}
          isLoading={isSubmitting}
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>

        {error && (
          <div className="flex items-center gap-2.5 text-sm rounded-lg px-4 py-2.5 bg-red-50 text-red-600 border border-red-200">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}
      </form>
    </AuthCard>
  );
}
