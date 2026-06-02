import AdminAuthWrapper from "@/components/auth/AdminAuthWrapper";
import UsuariosClient from "./UsuariosClient";

export default function UsuariosPage() {
  return (
    <AdminAuthWrapper>
      <UsuariosClient />
    </AdminAuthWrapper>
  );
}
