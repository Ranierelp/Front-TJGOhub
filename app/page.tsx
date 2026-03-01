"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Spinner } from "@/components/ui/spinner";

/**
 * Página raiz ('/'). Redireciona para o login.
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("auth/login/");
  }, [router]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <Spinner label="Carregando..." size="lg" />
    </div>
  );
}
