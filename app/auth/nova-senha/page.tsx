"use client";

import React, { useState } from "react";
import { Eye, EyeOff, LockKeyhole, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { confirmPasswordReset } from "@/lib/api/users";

export default function NovaSenhaPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const key = searchParams.get("key") ?? "";

  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Link inválido — id ou key ausentes na URL
  const linkInvalido = !id || !key;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setMessage("As senhas não coincidem."); return; }
    if (newPw.length < 8) { setMessage("Mínimo de 8 caracteres."); return; }
    if (!/[A-Z]/.test(newPw)) { setMessage("Inclua ao menos uma letra maiúscula."); return; }

    setMessage("");
    setIsLoading(true);
    try {
      await confirmPasswordReset({ id, key, new_password: newPw, confirm_password: confirmPw });
      setIsSuccess(true);
      setMessage("Senha redefinida com sucesso! Você já pode fazer login.");
      setNewPw("");
      setConfirmPw("");
    } catch {
      setMessage("Link inválido ou expirado. Solicite um novo link de recuperação.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      subtitle="Redefinir Senha"
      footer={
        <Link className="text-sm font-medium text-blue-600 hover:text-blue-800" href="/auth/login">
          {isSuccess ? "Ir para o Login" : "Voltar para o Login"}
        </Link>
      }
    >
      {linkInvalido ? (
        <div className="flex items-center gap-3 text-sm px-4 py-3 rounded-md border bg-red-100/70 border-red-400/50 text-red-800">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">Link inválido. Solicite um novo link de recuperação.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isSuccess && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nova senha</label>
                <Input
                  type={showNew ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPw}
                  onChange={(e) => { setNewPw(e.target.value); setMessage(""); }}
                  disabled={isLoading}
                  startContent={<LockKeyhole className="h-4 w-4 text-gray-400" />}
                  endContent={
                    <button type="button" onClick={() => setShowNew((v) => !v)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar nova senha</label>
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPw}
                  onChange={(e) => { setConfirmPw(e.target.value); setMessage(""); }}
                  disabled={isLoading}
                  startContent={<LockKeyhole className="h-4 w-4 text-gray-400" />}
                  endContent={
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>

              <ul className="space-y-1.5">
                <ReqItem met={newPw.length >= 8}>Mínimo 8 caracteres</ReqItem>
                <ReqItem met={/[A-Z]/.test(newPw)}>Ao menos uma letra maiúscula</ReqItem>
                <ReqItem met={!!newPw && newPw === confirmPw}>Senhas coincidem</ReqItem>
              </ul>

              <Button
                className="w-full font-semibold text-white border-0"
                style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" }}
                type="submit"
                disabled={!newPw || !confirmPw}
                isLoading={isLoading}
              >
                {isLoading ? "Salvando..." : "Redefinir Senha"}
              </Button>
            </>
          )}

          {message && (
            <div className={`flex items-center gap-3 text-sm px-4 py-3 rounded-md border ${
              isSuccess
                ? "bg-green-100/70 border-green-400/50 text-green-800"
                : "bg-red-100/70 border-red-400/50 text-red-800"
            }`}>
              {isSuccess ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
              <p className="font-medium">{message}</p>
            </div>
          )}
        </form>
      )}
    </AuthCard>
  );
}

function ReqItem({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      <span className={[
        "inline-flex items-center justify-center w-3.5 h-3.5 rounded-full flex-shrink-0",
        met ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground",
      ].join(" ")}>
        {met && (
          <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      <span className={met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
        {children}
      </span>
    </li>
  );
}
