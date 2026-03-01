// =============================================================================
// CONCEITO 1: RootLayout — o "base.html" do Next.js
//
// No Django você tem um base.html que define o esqueleto HTML compartilhado
// por todas as páginas (navbar, scripts, CSS globais...) e usa:
//   {% block content %}{% endblock %}
//
// No Next.js App Router, o equivalente é o arquivo layout.tsx.
// Todo componente filho (children) é renderizado onde está {children}.
//
// Este é o layout RAIZ — envolve absolutamente tudo na aplicação.
// Hierarquia de layouts:
//   app/layout.tsx          → envolve tudo (este arquivo)
//     app/auth/layout.tsx   → envolve só as páginas de auth
//       app/auth/login/page.tsx  → a página em si
//
// IMPORTANTE: layout.tsx NÃO tem "use client" — é um Server Component.
// Ele roda no servidor, gera HTML e envia para o browser.
// Só os filhos que precisam de interatividade têm "use client".
// =============================================================================

import "@/styles/globals.css"; // CSS global — importado aqui uma única vez
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";

// =============================================================================
// CONCEITO 2: export const metadata — SEO e metadados da página
//
// No Django você definiria o <title> e <meta> no template HTML manualmente.
// No Next.js, você exporta um objeto metadata e o framework injeta os
// <meta> tags corretos no <head> automaticamente.
//
// title.template: "%s | TJGOHub"
//   → o %s é substituído pelo título de cada página filha
//   → ex: "Login | TJGOHub", "Dashboard | TJGOHub"
//   → definido no layout.tsx de cada sub-rota via export const metadata
//
// Paralelo: é como o context_processors do Django que injeta dados no
// template de forma automática, sem precisar passar em cada view.
// =============================================================================
export const metadata: Metadata = {
  title: {
    default: siteConfig.name,          // título quando não há página específica
    template: `%s | ${siteConfig.name}`, // template para páginas filhas
  },
  description: siteConfig.description,
  // O favicon principal é definido pelo arquivo app/icon.svg (convenção do Next.js App Router).
  // O Next.js serve esse arquivo com uma URL versionada e injeta a tag <link> automaticamente.
  // NÃO colocar "icon" aqui para evitar conflito com o app/icon.svg.
  icons: {
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152" },
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
    ],
    shortcut: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json", // PWA manifest — transforma o site em app instalável
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.name,
    startupImage: [
      // Imagens de splash screen para diferentes iPhones (tamanhos de tela diferentes)
      { url: "/icons/icon-512x512.png", media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" },
      { url: "/icons/icon-512x512.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" },
      { url: "/icons/icon-512x512.png", media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/icons/icon-512x512.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/icons/icon-512x512.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/icons/icon-512x512.png", media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "msapplication-TileColor": "#1d4ed8",
    "msapplication-config": "/browserconfig.xml",
  },
};

// =============================================================================
// CONCEITO 3: export const viewport — configurações da viewport
//
// Separado de metadata porque o Next.js 14+ exige que viewport seja
// exportado separadamente para otimizações de performance.
// Gera a <meta name="viewport"> no <head>.
// =============================================================================
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,    // impede zoom em dispositivos móveis (padrão para apps)
  viewportFit: "cover",   // ocupa a tela inteira incluindo notch do iPhone
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#000000" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// =============================================================================
// CONCEITO 4: RootLayout — a função do layout
//
// Todo layout recebe "children" — é o conteúdo da página atual.
// É a mesma ideia de {% block content %} do Django, mas em JSX.
//
// React.ReactNode é o tipo TypeScript para "qualquer coisa que o React
// pode renderizar": JSX, string, número, null, array de elementos...
//
// A estrutura HTML completa fica aqui: <html>, <body> e os providers.
// Nenhuma outra página precisa se preocupar com isso.
// =============================================================================
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: o next-themes muda o atributo "class" do <html>
    // no cliente para aplicar o tema. Sem isso, o React reclama que o HTML
    // gerado no servidor (sem class de tema) é diferente do cliente (com class).
    <html suppressHydrationWarning lang="pt-br">
      <body
        className={clsx(
          // Classes Tailwind base para toda a aplicação
          "min-h-screen text-foreground bg-background font-sans antialiased",
          // fontSans.variable injeta a CSS variable --font-sans
          // que o tailwind.config usa em fontFamily: { sans: ["var(--font-sans)"] }
          fontSans.variable,
        )}
      >
        {/*
          Providers envolve TUDO — qualquer componente filho pode acessar
          o tema e os toasts. Ver providers.tsx para entender o Provider Pattern.
        */}
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          <div className="relative flex flex-col min-h-dvh pt-safe">
            {/* children = a página atual (ex: LoginPage, DashboardPage...) */}
            <main>{children}</main>
            {/* PWAInstallPrompt: botão "Instalar App" em browsers compatíveis */}
            <PWAInstallPrompt />
          </div>
        </Providers>
      </body>
    </html>
  );
}
