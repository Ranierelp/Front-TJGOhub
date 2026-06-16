import { Metadata } from "next";
import { CaseListClient } from "./_components/CaseListClient";

export const metadata: Metadata = { title: "Casos" };

export default function CasosPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <CaseListClient />
    </div>
  );
}
