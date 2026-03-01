import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Entre na sua conta para acessar o TJGOHub.",
};

// Testar erro
// export default function Page() {
//   throw new Error("Erro de teste!");
// }

// import { notFound } from "next/navigation";

// export default function Page() {
//   notFound();
// }

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* {
        // Testar loading
        await new Promise((res) => setTimeout(res, 3000))
      } */}
      {children}
    </>
  );
}
