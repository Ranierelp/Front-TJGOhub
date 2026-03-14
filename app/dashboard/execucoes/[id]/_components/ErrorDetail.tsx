// Bloco de erro no estilo terminal: fundo escuro, fonte monospace.
// Exibe error_message em vermelho e stack_trace em cinza (opcional).
// Botoes de acao (copiar, marcar flaky) ficam no ResultCard, nao aqui.

interface ErrorDetailProps {
  errorMessage: string;
  stackTrace?: string | null;
}

export function ErrorDetail({ errorMessage, stackTrace }: ErrorDetailProps) {
  return (
    <div
      className="rounded-lg overflow-hidden text-xs"
      style={{
        background: "#0f172a",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Label "Error Message" */}
      <div
        className="px-4 py-2"
        style={{
          background: "rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          color: "#94a3b8",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        Error Message
      </div>

      {/* Mensagem principal */}
      <pre
        className="px-4 py-3 whitespace-pre-wrap break-words font-mono overflow-x-auto"
        style={{ color: "#fca5a5", margin: 0 }}
      >
        {errorMessage}
      </pre>

      {/* Stack trace (opcional) */}
      {stackTrace && (
        <>
          <div
            className="px-4 py-1 font-semibold tracking-wider"
            style={{
              color: "#475569",
              fontSize: 10,
              background: "rgba(255,255,255,0.03)",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            STACK TRACE
          </div>
          <pre
            className="px-4 py-3 whitespace-pre-wrap break-words font-mono overflow-x-auto"
            style={{ color: "#64748b", margin: 0 }}
          >
            {stackTrace}
          </pre>
        </>
      )}
    </div>
  );
}
