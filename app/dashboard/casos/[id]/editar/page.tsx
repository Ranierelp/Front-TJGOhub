import { redirect } from "next/navigation";

// A edição agora acontece na mesma página do detalhe (/dashboard/casos/[id]/).
// Esta rota existe apenas para não quebrar links antigos que apontem para /editar/.
export default function EditarCasoPage({ params }: { params: { id: string } }) {
  redirect(`/dashboard/casos/${params.id}/`);
}
