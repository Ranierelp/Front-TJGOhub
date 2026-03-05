import { Metadata } from "next";
import { ProjectDetailClient } from "./_components/ProjectDetailClient";

export const metadata: Metadata = { title: "Detalhes do Projeto" };

// Next.js 15: params é uma Promise em server components
export default async function ProjetoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <ProjectDetailClient id={id} />
    </div>
  );
}
