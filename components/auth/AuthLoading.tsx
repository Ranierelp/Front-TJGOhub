"use client";

import React from "react";

import { Spinner } from "@/components/ui/spinner";

interface AuthLoadingProps {
  message?: string;
}

export default function AuthLoading({
  message = "Carregando...",
}: AuthLoadingProps) {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <Spinner label={message} size="lg" />
        <p className="text-gray-400 text-sm">Verificando autenticação...</p>
      </div>
    </div>
  );
}
