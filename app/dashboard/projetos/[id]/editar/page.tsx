import { Metadata } from "next";
import { EditProjectClient } from "./_components/EditProjectClient";

export const metadata: Metadata = { title: "Editar Projeto" };

export default async function EditarProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <EditProjectClient id={id} />
    </div>
  );
}
