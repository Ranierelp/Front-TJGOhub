import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ativação Pendente",
  description:
    "Sua conta está pendente de ativação. Verifique seu e-mail para mais detalhes.",
};

export default function PendingActivationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
