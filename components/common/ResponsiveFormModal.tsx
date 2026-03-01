"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import ResponsiveModal from "./ResponsiveModal";

interface ResponsiveFormModalProps {
  isOpen: boolean;
  title: string | React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  isSubmitting?: boolean;
  isReadOnly?: boolean;
  submitButtonText?: string;
  cancelButtonText?: string;
  closeButtonText?: string;
  formId?: string;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  footer?: React.ReactNode | null;
}

export default function ResponsiveFormModal({
  isOpen,
  title,
  children,
  size = "2xl",
  isSubmitting = false,
  isReadOnly = false,
  submitButtonText = "Salvar",
  cancelButtonText = "Cancelar",
  closeButtonText = "Fechar",
  formId = "form-modal",
  onClose,
  onSubmit,
  footer,
}: ResponsiveFormModalProps) {
  const defaultFooter = isReadOnly ? (
    <Button variant="outline" onClick={onClose}>
      {closeButtonText}
    </Button>
  ) : (
    <>
      <Button
        disabled={isSubmitting}
        variant="outline"
        onClick={onClose}
      >
        {cancelButtonText}
      </Button>
      <Button
        disabled={isSubmitting}
        form={formId}
        type="submit"
      >
        {submitButtonText}
      </Button>
    </>
  );

  const finalFooter = footer !== undefined ? footer : defaultFooter;

  return (
    <ResponsiveModal
      footer={finalFooter} // Passa o rodapé correto para o modal base
      isOpen={isOpen}
      isSubmitting={isSubmitting}
      size={size}
      title={title}
      onClose={onClose}
    >
      {onSubmit ? (
        <form
          className="space-y-4"
          id={formId}
          style={{
            // Adiciona font-size mínimo para inputs em mobile para prevenir autozoom
            fontSize: "16px",
          }}
          onSubmit={onSubmit}
        >
          {children}
        </form>
      ) : (
        <div
          className="space-y-4"
          style={{
            // Adiciona font-size mínimo para inputs em mobile para prevenir autozoom
            fontSize: "16px",
          }}
        >
          {children}
        </div>
      )}
    </ResponsiveModal>
  );
}
