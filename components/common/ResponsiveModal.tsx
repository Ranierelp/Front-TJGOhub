"use client";

import React, { Fragment, useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResponsiveModalProps {
  isOpen: boolean;
  title: string | React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  isSubmitting?: boolean;
  onClose: () => void;
  footerAlignment?: "start" | "center" | "end" | "stretch";
}

const sizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
};

export default function ResponsiveModal({
  isOpen,
  title,
  children,
  footer,
  size = "2xl",
  isSubmitting = false,
  onClose,
  footerAlignment = "end",
}: ResponsiveModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const originalViewportRef = useRef<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen && isMobile) {
      // Salva o viewport original apenas uma vez
      if (!originalViewportRef.current) {
        const viewport = document.querySelector('meta[name="viewport"]');

        if (viewport) {
          originalViewportRef.current = viewport.getAttribute("content");
        }
      }

      // Define viewport para prevenir zoom em inputs
      const viewport = document.querySelector('meta[name="viewport"]');

      if (viewport) {
        viewport.setAttribute(
          "content",
          "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
        );
      }

      // Adiciona classe para prevenir scroll do body
      document.body.classList.add("overflow-hidden", "modal-open");
    }

    return () => {
      if (isMobile) {
        // Restaura o viewport original
        const viewport = document.querySelector('meta[name="viewport"]');

        if (viewport && originalViewportRef.current) {
          viewport.setAttribute("content", originalViewportRef.current);
        }

        // Remove a classe de overflow
        document.body.classList.remove("overflow-hidden", "modal-open");
      }
    };
  }, [isOpen, isMobile]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const alignmentClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    stretch: "justify-stretch",
  };

  return (
    <Transition appear as={Fragment} show={isOpen}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center text-center sm:items-center sm:p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel
                className={`relative w-full transform text-left shadow-xl transition-all ${
                  isMobile
                    ? "h-screen max-h-screen"
                    : sizeClasses.hasOwnProperty(size)
                      ? sizeClasses[size as keyof typeof sizeClasses]
                      : "sm:max-w-2xl"
                } ${
                  isMobile
                    ? "bg-neutral-900 rounded-none"
                    : "bg-neutral-900 rounded-t-2xl sm:rounded-lg"
                }`}
                style={{
                  // Previne autozoom em dispositivos móveis quando inputs recebem foco
                  fontSize: isMobile ? "16px" : undefined,
                }}
              >
                <div
                  className={`flex flex-col h-full ${
                    isMobile ? "min-h-screen" : "min-h-0"
                  }`}
                >
                  {/* Header */}
                  <header
                    className={`flex items-center justify-between border-b border-divider shrink-0 ${
                      isMobile ? "p-4 bg-neutral-900 z-10" : "p-4 sm:p-6"
                    }`}
                  >
                    <DialogTitle
                      as="h3"
                      className="text-lg font-semibold leading-6 text-foreground pr-4 flex-1 min-w-0"
                    >
                      <span className="truncate block">{title}</span>
                    </DialogTitle>
                    <Button
                      className="inline-flex shrink-0"
                      disabled={isSubmitting}
                      size="icon"
                      variant="ghost"
                      onClick={handleClose}
                    >
                      <X size={20} />
                    </Button>
                  </header>

                  {/* Body */}
                  <div
                    className={`flex-1 overflow-y-auto ${
                      isMobile ? "p-4" : "p-4 sm:p-6"
                    } ${!footer ? "pb-safe" : ""}`}
                  >
                    <div className="w-full">{children}</div>
                  </div>

                  {/* Footer */}
                  {footer && (
                    <footer
                      className={`
                        border-t border-divider flex items-center
                        ${isMobile ? "p-4 sticky bottom-0 bg-neutral-900 z-10" : "p-4"}
                        ${alignmentClasses[footerAlignment]}
                      `}
                    >
                      <div
                        className={
                          footerAlignment === "stretch"
                            ? "w-full"
                            : "flex items-center gap-2"
                        }
                      >
                        {footer}
                      </div>
                    </footer>
                  )}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
