"use client";

import { Spinner } from "@/components/ui/spinner";

/**
 * Tela de carregamento global — exibida durante transições de rota e
 * carregamentos iniciais. Usa o escudo TJGO como identificação visual.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        {/* Escudo TJGO — mesmo ícone usado no favicon e no AuthCard */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          width={80}
          height={80}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="tjgo-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="7" fill="url(#tjgo-grad)" />
          <path
            d="M16 26s8-4 8-10V9l-8-3-8 3v7c0 6 8 10 8 10z"
            fill="white"
            stroke="white"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <Spinner label="Carregando..." size="lg" />
      </div>
    </div>
  );
}
