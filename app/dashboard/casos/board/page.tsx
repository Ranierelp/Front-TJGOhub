import { Metadata } from "next";
import { KanbanPageClient } from "./_components/KanbanPageClient";

export const metadata: Metadata = { title: "Board de Casos" };

export default function KanbanBoardPage() {
  return (
    <div className="px-6 py-6">
      <KanbanPageClient />
    </div>
  );
}