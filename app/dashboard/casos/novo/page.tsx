// Server Component — apenas renderiza o formulário client-side.
// A lógica (fetch de projetos/tags, submit, upload) fica no CreateCaseClient.
import { Metadata } from "next";
import { CreateCaseClient } from "./_components/CreateCaseClient";

export const metadata: Metadata = { title: "Novo Caso" };

export default function NovoCasoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <CreateCaseClient />
    </div>
  );
}
