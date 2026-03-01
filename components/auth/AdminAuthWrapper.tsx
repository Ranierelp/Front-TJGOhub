"use client";

import React from "react";
import { ShieldOff } from "lucide-react";

import AuthLoading from "./AuthLoading";

import { useAuth } from "@/hooks/useAuth";

// Componente para a tela de "Acesso Negado"
const AccessDenied = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-900 text-white">
      <ShieldOff className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-3xl font-bold">Acesso Negado</h1>
      <p className="mt-2 text-gray-400">
        Você não tem permissão para visualizar esta página.
      </p>
      <p className="text-sm text-gray-500 mt-1">
        Contate um administrador se você acredita que isso é um erro.
      </p>
    </div>
  );
};

interface AdminAuthWrapperProps {
  children: React.ReactNode;
}

export default function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const { isLoading, isAuthenticated, isAdmin, isStaff } = useAuth();

  const isAdminOrStaff = isAdmin || isStaff;

  // Estado de carregamento (inclui hidratação)
  if (isLoading) {
    return <AuthLoading message="Verificando permissões..." />;
  }

  // Se não estiver autenticado ou não tiver permissão, mostra acesso negado
  if (!isAuthenticated || !isAdminOrStaff) {
    return <AccessDenied />;
  }

  // Se estiver autorizado, renderiza o conteúdo da página
  return <>{children}</>;
}
