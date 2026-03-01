import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registro",
  description: "Crie sua conta para acessar o sistema de Medhub da UNIFIP.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
