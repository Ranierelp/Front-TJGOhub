import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registro",
  description: "Crie sua conta para acessar o TJGOHub.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
