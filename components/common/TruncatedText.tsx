import { useEffect, useRef, useState } from "react";

export const TruncatedText = ({
  text,
  lineClamp = 3,
}: {
  text: string;
  lineClamp?: number;
}) => {
  // Estado para controlar se o texto está expandido
  const [isExpanded, setIsExpanded] = useState(false);
  // Estado para saber se o botão "Ler mais" deve ser mostrado
  const [isTruncated, setIsTruncated] = useState(false);
  // Ref para aceder ao elemento <p> no DOM
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = textRef.current;

    // Função para verificar se o texto está a ser cortado
    const checkTruncation = () => {
      if (element) {
        // Compara a altura total do conteúdo com a altura visível do elemento
        if (element.scrollHeight > element.clientHeight) {
          setIsTruncated(true);
        } else {
          setIsTruncated(false);
        }
      }
    };

    // Verifica a truncação após a renderização e sempre que a janela for redimensionada
    checkTruncation();
    window.addEventListener("resize", checkTruncation);

    // Limpa o listener de evento quando o componente é desmontado
    return () => {
      window.removeEventListener("resize", checkTruncation);
    };
  }, [text]); // Reavalia se o texto mudar

  if (!text) {
    return null;
  }

  return (
    <div className="relative">
      <p
        ref={textRef}
        className={`${!isExpanded ? `line-clamp-${lineClamp}` : ""} transition-all text-justify`}
      >
        {text}
      </p>
      {/* Só mostra o botão se o texto estiver realmente a ser cortado */}
      {isTruncated && (
        <button
          className="text-sm text-primary mt-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Ler menos" : "Ler mais"}
        </button>
      )}
    </div>
  );
};
