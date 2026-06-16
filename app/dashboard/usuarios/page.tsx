import { Metadata } from "next";
import AdminAuthWrapper from "@/components/auth/AdminAuthWrapper";
import UsuariosClient from "./UsuariosClient";

export const metadata: Metadata = { title: "Usuários" };

export default function UsuariosPage() {
  return (
    <AdminAuthWrapper>
      <UsuariosClient />
    </AdminAuthWrapper>
  );
}
