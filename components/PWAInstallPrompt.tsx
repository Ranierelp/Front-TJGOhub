"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Apple, Share } from "lucide-react"; // Ícones importados

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface IOSInstallInstructions {
  show: boolean;
  isIPad: boolean;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [iosInstructions, setIOSInstructions] =
    useState<IOSInstallInstructions>({
      show: false,
      isIPad: false,
    });

  useEffect(() => {
    const isIOS = () => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent);
    };

    const isIPad = () => {
      return (
        /iPad/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      );
    };

    const isInStandaloneMode = () => {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in window.navigator && window.navigator.standalone)
      );
    };

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();

      const hasPromptedThisSession = sessionStorage.getItem(
        "pwa-install-prompted",
      );
      const hasPromptedRecently = localStorage.getItem("pwa-install-dismissed");
      const dismissedDate = hasPromptedRecently
        ? new Date(hasPromptedRecently)
        : null;
      const daysSinceDismissed = dismissedDate
        ? (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
        : 7;

      if (hasPromptedThisSession || daysSinceDismissed < 7) {
        return;
      }

      setDeferredPrompt(e);
      setShowInstallPrompt(true);
      sessionStorage.setItem("pwa-install-prompted", "true");
    };

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      setIOSInstructions({ show: false, isIPad: false });
      localStorage.removeItem("pwa-install-dismissed");
    };

    if (isIOS() && !isInStandaloneMode()) {
      const hasPromptedIOS = sessionStorage.getItem("ios-install-prompted");
      const hasPromptedRecentlyIOS = localStorage.getItem(
        "ios-install-dismissed",
      );
      const dismissedDateIOS = hasPromptedRecentlyIOS
        ? new Date(hasPromptedRecentlyIOS)
        : null;
      const daysSinceDismissedIOS = dismissedDateIOS
        ? (Date.now() - dismissedDateIOS.getTime()) / (1000 * 60 * 60 * 24)
        : 7;

      if (!hasPromptedIOS && daysSinceDismissedIOS >= 7) {
        setTimeout(() => {
          setIOSInstructions({ show: true, isIPad: isIPad() });
          sessionStorage.setItem("ios-install-prompted", "true");
        }, 2000);
      }
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener,
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "dismissed") {
      localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
  };

  const handleIOSDismiss = () => {
    setIOSInstructions({ show: false, isIPad: false });
    localStorage.setItem("ios-install-dismissed", new Date().toISOString());
  };

  // Prompt padrão para Android/Chrome
  if (showInstallPrompt && !iosInstructions.show) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-background/90 backdrop-blur-md border-primary/20">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                {/* Ícone substituído */}
                <Smartphone className="text-success w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  Instalar Medhub
                </h3>
                <p className="text-xs text-muted-foreground">
                  Acesso rápido e funciona offline
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                size="sm"
                variant="outline"
                onClick={handleDismiss}
              >
                Agora não
              </Button>
              <Button
                className="flex-1"
                size="sm"
                onClick={handleInstallClick}
              >
                Instalar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Instruções para iOS
  if (iosInstructions.show) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-background/90 backdrop-blur-md border-primary/20">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                {/* Ícone substituído */}
                <Apple className="text-success w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  Instalar no {iosInstructions.isIPad ? "iPad" : "iPhone"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Adicione à tela inicial para acesso rápido
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="text-blue-500">1.</span>
                {/* Ícone substituído */}
                <span className="flex items-center gap-1.5">
                  Toque no botão <Share className="w-4 h-4 text-blue-500" />{" "}
                  compartilhar
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">2.</span>
                <span>Escolha &ldquo;Adicionar à Tela Inicial&rdquo;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">3.</span>
                <span>Toque em &ldquo;Adicionar&rdquo;</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="sm"
              variant="outline"
              onClick={handleIOSDismiss}
            >
              Entendi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
