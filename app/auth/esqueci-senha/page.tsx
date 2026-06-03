"use client";

import React, { useState } from "react";
import { Mail, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/api/users";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setMessage("Se o e-mail existir, um link de recuperação foi enviado.");
      setIsSuccess(true);
      setEmail("");
    } catch {
      setMessage("Erro ao processar solicitação. Tente novamente.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      subtitle="Recuperar Acesso"
      footer={
        <Link
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
          href="/auth/login"
        >
          Lembrou a senha? Voltar para o Login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {!isSuccess && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
                Enviar link por e-mail
              </label>
              <Input
                autoComplete="email"
                disabled={isLoading}
                id="email"
                placeholder="usuario@tjgo.jus.br"
                startContent={<Mail className="h-4 w-4 text-gray-400" />}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button
              className="w-full font-semibold text-white border-0"
              style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" }}
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
                ? "bg-green-100/70 border-green-400/50 text-green-800"
                : "bg-red-100/70 border-red-400/50 text-red-800"
            }`}
          >
            {isSuccess ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="font-medium">{message}</p>
          </div>
        )}
      </form>
    </AuthCard>
  );
}
