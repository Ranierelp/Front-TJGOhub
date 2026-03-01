"use client";

// =============================================================================
// CONCEITO 1: Provider Pattern — o "middleware" do React
//
// O Provider Pattern é a forma do React compartilhar dados com uma árvore
// inteira de componentes sem precisar passar props manualmente em cada nível.
//
// Funcionamento:
//   <Provider valor={x}>
//     <Filho />         ← consegue acessar "x"
//       <Neto />        ← também consegue acessar "x"
//         <Bisneto />   ← também consegue acessar "x"
//   </Provider>
//
// Paralelo Django: é como o context_processors — dados injetados
// globalmente no contexto sem precisar passar em cada view.
//
// Aqui temos dois providers empilhados:
//   1. NextThemesProvider → fornece o tema (claro/escuro) para toda a app
//   2. Toaster (Sonner)   → habilita toasts em qualquer componente
//
// Qualquer componente da aplicação pode usar:
//   const { theme, setTheme } = useTheme()  → hook do next-themes
//   import { toast } from "sonner"          → função de toast global
// =============================================================================

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";

// =============================================================================
// CONCEITO 2: Props com children
//
// "children" é uma prop especial do React — representa o conteúdo JSX
// passado entre as tags de abertura e fechamento de um componente.
//
// Exemplo de uso:
//   <Providers themeProps={{ defaultTheme: "light" }}>
//     <App />       ← isto é o "children"
//   </Providers>
//
// React.ReactNode é o tipo para qualquer coisa renderizável.
// O "?" em themeProps? indica que é opcional.
// =============================================================================
export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    // NextThemesProvider gerencia o tema claro/escuro.
    // attribute="class" → adiciona a classe "dark" no <html> quando escuro
    // defaultTheme="dark" → tema inicial, sobrescrito pelo themeProps do layout
    // {...themeProps} → spread das props extras que vieram do layout.tsx
    <NextThemesProvider attribute="class" defaultTheme="dark" {...themeProps}>

      {/* children é renderizado aqui — toda a aplicação fica dentro do provider */}
      {children}

      {/*
        Toaster do Sonner — registra o ponto de montagem dos toasts.
        Sem este componente, chamar toast("mensagem") em qualquer lugar
        não funcionaria. É como registrar um "container" de notificações.

        Uso em qualquer componente:
          import { toast } from "sonner"
          toast.success("Salvo!")
          toast.error("Erro ao salvar")
      */}
      <Toaster position="top-right" richColors />

    </NextThemesProvider>
  );
}
