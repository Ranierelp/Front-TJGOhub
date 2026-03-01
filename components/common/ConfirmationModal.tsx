"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import ResponsiveModal from "@/components/common/ResponsiveModal";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  message?: string;
  color?: "success" | "danger";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar Ação",
  message = "Você tem certeza?",
  color = "danger",
}: ConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await onConfirm();
  };

  const Icon = color === "success" ? CheckCircle : AlertTriangle;
  const iconColorClass = color === "success" ? "text-emerald-500" : "text-destructive";

  return (
    <ResponsiveModal
      footer={
        <>
          <Button
            disabled={isLoading}
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            disabled={isLoading}
            variant={color === "danger" ? "destructive" : "default"}
            onClick={handleConfirm}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </Button>
        </>
      }
      isOpen={isOpen}
      isSubmitting={isLoading}
      size="md"
      title={
        <div className={`flex items-center gap-2 ${iconColorClass}`}>
          <Icon className="h-5 w-5" />
          {title}
        </div>
      }
      onClose={onClose}
    >
      <p>{message}</p>
    </ResponsiveModal>
  );
}
