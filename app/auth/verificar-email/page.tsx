"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { Logo } from "@/components/icons";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function VerificarEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const code = searchParams.get("code");
  const key = searchParams.get("key");

  useEffect(() => {
    // Encaminhar para o endpoint de verificação de e-mail do backend
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    let verifyUrl = `${apiBase}/auth/verify-email`;

    const params = new URLSearchParams();

    if (token) params.append("token", token);
    if (code) params.append("code", code);
    if (key) params.append("key", key);

    if (params.toString()) {
      verifyUrl += `?${params.toString()}`;
    }

    window.location.href = verifyUrl;
  }, [token, code, key]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center justify-center gap-2">
          <Logo size={120} />
          <h1 className="text-2xl font-bold mt-4">Verificar Email</h1>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Aguarde enquanto verificamos seu email.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    </div>
  );
}
