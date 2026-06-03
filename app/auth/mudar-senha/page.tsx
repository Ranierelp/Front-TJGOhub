"use client";

import React, { useState } from "react";
import { Eye, EyeOff, AlertTriangle, CheckCircle, LockKeyhole } from "lucide-react";
import Link from "next/link";

import { passwordSchema, type PasswordFormData } from "@/lib/validators";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/authStore";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MudarSenhaPage() {
  const [isCurrentVisible, setIsCurrentVisible] = useState(false);
  const [isVisible, setIsVisible]               = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [message, setMessage]                   = useState("");
  const [isSuccess, setIsSuccess]               = useState(false);

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
      // TODO: chamar endpoint de mudança de senha do backend
      setMessage("Senha alterada com sucesso!");
      setIsSuccess(true);
      reset();
    } catch {
      setMessage("Erro ao alterar senha. Tente novamente.");
      setIsSuccess(false);
    }
  };

  return (
    <AuthCard
      subtitle="Alterar Senha"
      footer={
        <Link
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
          href="/dashboard/perfil"
        >
          ← Voltar ao perfil
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="currentPassword">
            Senha atual
          </label>
          <Input
            {...register("currentPassword")}
            id="currentPassword"
            autoComplete="current-password"
            placeholder="••••••••"
            startContent={<LockKeyhole className="h-4 w-4 text-gray-400" />}
            endContent={
              <button type="button" className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsCurrentVisible((v) => !v)}>
                {isCurrentVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            type={isCurrentVisible ? "text" : "password"}
            error={errors.currentPassword?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="newPassword">
            Nova senha
          </label>
          <Input
            {...register("newPassword")}
            id="newPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            startContent={<LockKeyhole className="h-4 w-4 text-gray-400" />}
            endContent={
              <button type="button" className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsVisible((v) => !v)}>
                {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            type={isVisible ? "text" : "password"}
            error={errors.newPassword?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="confirmPassword">
            Confirmar nova senha
          </label>
          <Input
            {...register("confirmPassword")}
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            startContent={<LockKeyhole className="h-4 w-4 text-gray-400" />}
            endContent={
              <button type="button" className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsConfirmVisible((v) => !v)}>
                {isConfirmVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            type={isConfirmVisible ? "text" : "password"}
            error={errors.confirmPassword?.message}
          />
        </div>

        <Button
          type="submit"
          className="w-full font-semibold text-white border-0"
          style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" }}
          isLoading={isSubmitting || isLoading}
        >
          {isSubmitting || isLoading ? "Alterando..." : "Alterar Senha"}
        </Button>

        {message && (
          <div className={`flex items-center gap-3 text-sm px-4 py-3 rounded-md border ${
            isSuccess
              ? "bg-green-100/70 border-green-400/50 text-green-800"
              : "bg-red-100/70 border-red-400/50 text-red-800"
          }`}>
            {isSuccess
              ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
              : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            <p className="font-medium">{message}</p>
          </div>
        )}

      </form>
    </AuthCard>
  );
}
