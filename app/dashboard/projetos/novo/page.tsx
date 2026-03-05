import { Metadata } from "next";
import { CreateProjectClient } from "./_components/CreateProjectClient";

export const metadata: Metadata = { title: "Novo Projeto" };

export default function NovoProjetoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <CreateProjectClient />
    </div>
  );
}
