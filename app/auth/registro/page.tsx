"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole, Mail, User, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { registerSchema, type RegisterFormData } from "@/lib/validators";
import { useGuestRoute } from "@/hooks/useAuthGuard";
import { useAuthStore } from "@/stores/authStore";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

// Classe base dos inputs — estilo TJGO (cinza claro + foco azul)
const INPUT_CLASS =
  "bg-gray-50 border-gray-200 focus-visible:ring-blue-500 placeholder:text-gray-400";

// =============================================================================
// CONCEITO: watch() do react-hook-form
//
// Assim como useState "observa" uma variável local, watch() "observa" o
// valor de um campo do formulário em tempo real — sem precisar de onChange.
//
// Usamos para calcular a força da senha enquanto o usuário digita.
// watch("password1") retorna a string atual do campo, ou "" se vazio.
// =============================================================================

// Função auxiliar: calcula a força da senha com base em critérios cumulativos.
// Retorna { width (%), color (hex), label (texto) } para renderizar a barra.
function calcularForca(senha: string): { width: number; color: string; label: string } {
  if (!senha) return { width: 0, color: "", label: "" };

  let score = 0;
  if (senha.length >= 8)           score++; // comprimento mínimo
  if (/[a-z]/.test(senha))         score++; // minúsculas
  if (/[A-Z]/.test(senha))         score++; // maiúsculas
  if (/\d/.test(senha))            score++; // números
  if (/[^a-zA-Z0-9]/.test(senha))  score++; // caracteres especiais

  if (score <= 2) return { width: score * 20, color: "#ef4444", label: "Muito fraca" };
  if (score === 3) return { width: 60,        color: "#f59e0b", label: "Média" };
  if (score === 4) return { width: 80,        color: "#3b82f6", label: "Boa" };
  return               { width: 100,          color: "#22c55e", label: "Forte" };
}

export default function RegisterPage() {
  const { isLoading: authLoading } = useGuestRoute();

  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const { register: registerUser } = useAuthStore();

  // watch é desestruturado junto com register, handleSubmit, etc.
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { terms: false },
  });

  // Observa o valor atual de password1 para calcular a barra de força
  const password1Value = watch("password1", "");
  const forca = calcularForca(password1Value);

  const onSubmit = async (data: RegisterFormData) => {
    setSubmitResult(null);
    const result = await registerUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password1: data.password1,
      password2: data.password2,
      terms: data.terms,
    });
    setSubmitResult(result);
  };

  // Estado de carregamento
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

  // Tela de sucesso — substitui o formulário após cadastro bem-sucedido.
  // O backend envia email de verificação, então não redirecionamos para o login
  // automaticamente — o usuário precisa confirmar o email primeiro.
  if (submitResult?.success) {
    return (
      <main
        className="flex min-h-screen items-center justify-center p-4"
        style={{ background: "linear-gradient(145deg, #2d5fa8 0%, #4a8fd4 50%, #3a7bc8 100%)" }}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-[420px] p-10 text-center animate-slide-up"
          style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.15)" }}
        >
          <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Cadastro realizado!</h2>
          <p className="text-sm text-gray-500 mb-6">{submitResult.message}</p>
          <Link
            href="/auth/login"
            className="block w-full py-3 rounded-lg font-semibold text-white text-center"
            style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" }}
          >
            Ir para o login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <AuthCard
      subtitle="Criar nova conta"
      wide
      footer={
        <p className="text-sm text-gray-500">
          Já tem uma conta?{" "}
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 font-medium">
            Entrar
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Campos: Nome e Sobrenome lado a lado — grid de 2 colunas igual ao Django */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="firstName">
              Nome
            </label>
            <Input
              {...register("firstName")}
              id="firstName"
              autoComplete="given-name"
              className={INPUT_CLASS}
              disabled={isSubmitting}
              error={errors.firstName?.message}
              placeholder="Raniere"
              startContent={<User className="h-4 w-4 text-gray-400" />}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="lastName">
              Sobrenome
            </label>
            <Input
              {...register("lastName")}
              id="lastName"
              autoComplete="family-name"
              className={INPUT_CLASS}
              disabled={isSubmitting}
              error={errors.lastName?.message}
              placeholder="Luiz"
              startContent={<User className="h-4 w-4 text-gray-400" />}
            />
          </div>
        </div>

        {/* Campo: email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
            Email
          </label>
          <Input
            {...register("email")}
            id="email"
            autoComplete="email"
            className={INPUT_CLASS}
            disabled={isSubmitting}
            error={errors.email?.message}
            placeholder="usuario@tjgo.jus.br"
            startContent={<Mail className="h-4 w-4 text-gray-400" />}
            type="email"
          />
        </div>

        {/* Campo: senha com barra de força — novidade em relação ao Django */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="password1">
            Senha
          </label>
          <Input
            {...register("password1")}
            id="password1"
            autoComplete="new-password"
            className={INPUT_CLASS}
            disabled={isSubmitting}
            error={errors.password1?.message}
            placeholder="Mínimo 8 caracteres"
            startContent={<LockKeyhole className="h-4 w-4 text-gray-400" />}
            type={showPassword1 ? "text" : "password"}
            endContent={
              <button
                type="button"
                aria-label={showPassword1 ? "Ocultar senha" : "Mostrar senha"}
                className="focus:outline-none text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword1((v) => !v)}
              >
                {showPassword1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          {/* Barra de força: só aparece quando há algo digitado */}
          {password1Value && (
            <div className="mt-2">
              <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${forca.width}%`, background: forca.color }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: forca.color }}>
                {forca.label}
              </p>
            </div>
          )}
        </div>

        {/* Campo: confirmar senha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="password2">
            Confirmar senha
          </label>
          <Input
            {...register("password2")}
            id="password2"
            autoComplete="new-password"
            className={INPUT_CLASS}
            disabled={isSubmitting}
            error={errors.password2?.message}
            placeholder="Repita a senha"
            startContent={<LockKeyhole className="h-4 w-4 text-gray-400" />}
            type={showPassword2 ? "text" : "password"}
            endContent={
              <button
                type="button"
                aria-label={showPassword2 ? "Ocultar senha" : "Mostrar senha"}
                className="focus:outline-none text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword2((v) => !v)}
              >
                {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        {/* Campo: aceite de termos */}
        <div className="flex items-start gap-3 pt-1">
          <input
            {...register("terms")}
            id="terms"
            type="checkbox"
            disabled={isSubmitting}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
          />
          <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-snug">
            Li e aceito os{" "}
            <span className="font-medium text-blue-600">termos e condições</span>{" "}
            da plataforma
          </label>
        </div>
        {errors.terms && (
          <p className="text-xs text-red-500 -mt-2">{errors.terms.message}</p>
        )}

        {/* Botão com gradiente azul */}
        <Button
          type="submit"
          className="w-full font-semibold text-white border-0 mt-1"
          style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" }}
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {isSubmitting ? "Criando conta..." : "Criar conta"}
        </Button>

        {submitResult && !submitResult.success && (
          <div className="flex items-center gap-2.5 text-sm rounded-lg px-4 py-2.5 bg-red-50 text-red-600 border border-red-200">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p className="font-medium">{submitResult.message}</p>
          </div>
        )}
      </form>
    </AuthCard>
  );
}
