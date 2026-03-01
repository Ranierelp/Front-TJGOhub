"use client";

import React, { useEffect, useState } from "react";

import AuthLoading from "@/components/auth/AuthLoading";

interface ClientHydrationWrapperProps {
  children: React.ReactNode;
}

export default function ClientHydrationWrapper({
  children,
}: ClientHydrationWrapperProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return <AuthLoading message="Inicializando aplicação..." />;
  }

  return <>{children}</>;
}
