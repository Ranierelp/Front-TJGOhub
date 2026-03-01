import React from "react";
import { HardHat } from "lucide-react"; // Ícone mais apropriado
import { motion } from "framer-motion";

interface WorkInProgressOverlayProps {
  children: React.ReactNode;
}

export function WorkInProgressOverlay({
  children,
}: WorkInProgressOverlayProps) {
  // Animação de pulso sutil para o ícone
  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 2.5,
        ease: "easeInOut",
        repeat: Infinity,
      },
    },
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Conteúdo em segundo plano, desabilitado */}
      <div className="pointer-events-none blur-[2px]">{children}</div>

      {/* Sobreposição com o aviso */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center">
        {/* Fundo semi-transparente */}
        <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm dark:bg-gray-900/80" />

        <div className="relative flex flex-col items-center gap-4">
          {/* Ícone animado */}
          <motion.div animate="animate" variants={pulseVariants}>
            <HardHat
              className="h-14 w-14 text-teal-600 dark:text-teal-500"
              strokeWidth={1.5}
            />
          </motion.div>

          {/* Textos */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              Funcionalidade em Desenvolvimento
            </h1>
            <p className="mx-auto max-w-md text-sm text-gray-600 dark:text-gray-400 text-justify">
              Nossa equipe está trabalhando para finalizar esta nova ferramenta.
              Agradecemos a sua paciência e volte em breve para conferir as
              novidades!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
