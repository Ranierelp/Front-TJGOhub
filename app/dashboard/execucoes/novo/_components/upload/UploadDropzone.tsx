// =============================================================================
// UploadDropzone — área de drag & drop de arquivo JSON
//
// CONCEITO: FileReader API
//   O navegador não permite ler arquivos diretamente por segurança.
//   FileReader é a API nativa que lê o conteúdo de um arquivo selecionado:
//
//   const reader = new FileReader();
//   reader.onload = (e) => { const texto = e.target.result; };
//   reader.readAsText(file); // lê como string
//
//   É assíncrono: o .onload dispara quando a leitura termina.
//
// CONCEITO: useRef para input oculto
//   O botão "clique para selecionar" precisa disparar um <input type="file">.
//   Mas o input precisa estar no DOM para funcionar. Solução:
//     1. Cria um input invisível no DOM (display: none)
//     2. useRef cria uma "referência" direta ao elemento DOM
//     3. O botão chama inputRef.current.click() — como clicar no input
//
//   É diferente de useState porque useRef não causa re-render quando muda.
//   Serve para "segurar" referências a elementos DOM, timers, etc.
//
// CONCEITO: Drag & Drop events
//   onDragOver: dispara quando algo é arrastado POR CIMA da área
//     → precisa chamar e.preventDefault() para permitir o drop
//   onDrop: dispara quando o arquivo é solto
//     → e.dataTransfer.files[0] é o arquivo solto
// =============================================================================

"use client";

import { useRef, useState, useCallback } from "react";

interface UploadDropzoneProps {
  onFileLoaded: (file: File, data: unknown) => void;
  onClear:      () => void;
  selectedFile: File | null;
  error?:       string | null;
}

export function UploadDropzone({
  onFileLoaded,
  onClear,
  selectedFile,
  error,
}: UploadDropzoneProps) {
  const inputRef             = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Lê o arquivo com FileReader e valida que é JSON com run + results
  const processFile = useCallback((file: File) => {
    setParseError(null);

    if (!file.name.endsWith(".json")) {
      setParseError("Apenas arquivos .json são aceitos.");
      return;
    }

    const reader = new FileReader();

    // onload dispara quando a leitura termina (assíncrono)
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text); // lança exceção se não for JSON válido

        // Validação mínima: precisa ter run e results
        if (!data.run || !Array.isArray(data.results)) {
          setParseError("JSON inválido: precisa ter os campos \"run\" e \"results\".");
          return;
        }

        onFileLoaded(file, data); // avisa o pai: tudo ok
      } catch {
        setParseError("Arquivo inválido: não é um JSON válido.");
      }
    };

    reader.readAsText(file); // dispara a leitura
  }, [onFileLoaded]);

  // Drag over: precisa do preventDefault para permitir o drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // limpa o input para permitir selecionar o mesmo arquivo de novo
    e.target.value = "";
  }, [processFile]);

  const displayError = error ?? parseError;

  // ── Arquivo já selecionado ──────────────────────────────────────────────
  if (selectedFile) {
    return (
      <div
        style={{
          background: "rgba(22,163,74,0.07)",
          border: "2px solid rgba(22,163,74,0.3)",
          borderRadius: 14,
          padding: "28px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "rgba(22,163,74,0.15)", display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
        }}>
          📄
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--col-heading)", marginBottom: 2 }}>
            {selectedFile.name}
          </p>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
            background: "rgba(22,163,74,0.15)", color: "#16a34a",
          }}>
            ✓ Arquivo selecionado
          </span>
        </div>
        <button
          onClick={onClear}
          style={{
            padding: "6px 14px", borderRadius: 7,
            border: "1.5px solid var(--glass-card-border)",
            background: "var(--glass-field-bg)",
            fontSize: 12, fontWeight: 600, color: "var(--col-muted)",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          Remover
        </button>
      </div>
    );
  }

  // ── Área de drop (vazia) ────────────────────────────────────────────────
  return (
    <div>
      {/* input oculto — o useRef conecta o botão a ele */}
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleInputChange}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="Área de upload — arraste o arquivo JSON ou clique para selecionar"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? "#2563eb" : displayError ? "#dc2626" : "var(--glass-card-border)"}`,
          borderRadius: 14,
          padding: "48px 24px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "rgba(37,99,235,0.05)" : "var(--glass-card-bg)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          transition: "all 0.15s",
          boxShadow: "var(--glass-shadow)",
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: dragging ? "rgba(37,99,235,0.1)" : "rgba(37,99,235,0.06)",
          display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 14px", fontSize: 24,
        }}>
          {dragging ? "⬇" : "📄"}
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--col-heading)", marginBottom: 6 }}>
          {dragging ? "Solte o arquivo aqui" : "Arraste o arquivo JSON aqui"}
        </p>
        <p style={{ fontSize: 13, color: "var(--col-dim)" }}>
          ou{" "}
          <span style={{ color: "#2563eb", fontWeight: 600 }}>clique para selecionar</span>
          {" "}· aceita{" "}
          <code style={{ background: "var(--glass-field-bg)", padding: "1px 6px", borderRadius: 4, fontSize: 12, color: "var(--col-muted)" }}>
            tjgohub-report.json
          </code>
        </p>
      </div>

      {displayError && (
        <p style={{ fontSize: 13, color: "#dc2626", marginTop: 8, paddingLeft: 4 }}>
          ⚠ {displayError}
        </p>
      )}
    </div>
  );
}
