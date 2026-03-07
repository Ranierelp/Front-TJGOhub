"use client";

import { useRef, useState } from "react";
import { Trash2, ImagePlus, X } from "lucide-react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import type { PendingStep } from "@/hooks/useCreateCase";

interface Props {
  step:     PendingStep;
  index:    number;
  onUpdate: (i: number, step: PendingStep) => void;
  onRemove: (i: number) => void;
}

export function StepCard({ step, index, onUpdate, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);

  // FileReader gera uma data URL (base64) — sempre válida, sem problemas de CSP
  const setImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      onUpdate(index, { ...step, image: file, preview });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    onUpdate(index, { ...step, image: undefined, preview: undefined });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) setImage(file);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background:           "var(--glass-card-bg)",
        backdropFilter:       "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border:     hovered ? "1px solid rgba(147,197,253,0.6)" : "1px solid var(--glass-card-border)",
        boxShadow:            "var(--glass-shadow)",
        transition: "border-color 0.3s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cabeçalho do passo */}
      <div className="flex items-center gap-3 px-5 py-3.5" style={{
        background:   "var(--glass-card-header)",
        borderBottom: "1px solid var(--glass-inner-border)",
      }}>
        {/* Handle de drag (visual) */}
        <svg className="cursor-grab flex-shrink-0" width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: "#D1D5DB", opacity: hovered ? 1 : 0.3, transition: "opacity 0.2s" }}>
          <circle cx="9"  cy="5"  r="1.5" fill="currentColor"/>
          <circle cx="15" cy="5"  r="1.5" fill="currentColor"/>
          <circle cx="9"  cy="12" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="9"  cy="19" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="19" r="1.5" fill="currentColor"/>
        </svg>

        {/* Número do passo */}
        <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#2563EB,#3B82F6)", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}>
          {index + 1}
        </span>

        <span className="text-sm font-bold flex-1" style={{ color: "var(--col-body)" }}>
          Passo {index + 1}
        </span>

        {/* Botão remover — aparece no hover */}
        <button type="button" onClick={() => onRemove(index)}
          className="p-1.5 rounded-lg transition-all"
          style={{ color: "#D1D5DB", opacity: hovered ? 1 : 0, transition: "opacity 0.2s, color 0.2s, background 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.background = "rgba(254,226,226,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#D1D5DB"; e.currentTarget.style.background = "transparent"; }}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Zona de imagem */}
        {step.preview ? (
          <div className="relative">
            <Zoom>
              <img src={step.preview} alt={`Passo ${index + 1}`}
                className="w-full max-h-52 object-contain rounded-xl cursor-zoom-in"
                style={{ border: "1px solid var(--glass-inner-border)", background: "var(--glass-field-bg)" }} />
            </Zoom>
            <button type="button" onClick={removeImage}
              className="absolute top-2 right-2 rounded-full p-1 transition-all"
              style={{ background: "var(--glass-card-bg)", border: "1px solid var(--glass-inner-border)", color: "var(--col-dim)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#94A3B8"; }}>
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div
            className="rounded-xl p-7 text-center cursor-pointer transition-all"
            style={{ border: "2px dashed var(--glass-inner-border)", background: "var(--glass-field-bg)" }}
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)"; e.currentTarget.style.background = "rgba(239,246,255,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-inner-border)"; e.currentTarget.style.background = "var(--glass-field-bg)"; }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "linear-gradient(135deg,rgba(219,234,254,0.8),rgba(191,219,254,0.5))", color: "#3B82F6", border: "1px solid rgba(147,197,253,0.3)" }}>
              <ImagePlus className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--col-muted)" }}>
              Arraste imagens aqui ou{" "}
              <span className="font-bold" style={{ color: "#2563EB" }}>clique para selecionar</span>
            </p>
            <p className="text-xs mt-1.5" style={{ color: "var(--col-dim)" }}>PNG, JPG, GIF • até 5MB</p>
          </div>
        )}

        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) setImage(f); }} />

        {/* Descrição */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "var(--col-label)" }}>
            Descrição do Passo
          </label>
          <textarea
            placeholder="Descreva o que fazer neste passo..."
            value={step.description}
            onChange={e => onUpdate(index, { ...step, description: e.target.value })}
            rows={3}
            className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm resize-none"
            style={{ lineHeight: "1.7" }}
          />
        </div>
      </div>
    </div>
  );
}
