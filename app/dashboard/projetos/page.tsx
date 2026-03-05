import { Metadata } from "next";
import { ProjectListClient } from "./_components/ProjectListClient";

export const metadata: Metadata = { title: "Projetos" };

export default function ProjetosPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <ProjectListClient />
    </div>
  );
}
