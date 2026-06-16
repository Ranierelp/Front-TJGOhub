import { Metadata } from "next";
import PerfilClient from "./PerfilClient";

export const metadata: Metadata = { title: "Perfil" };

export default function PerfilPage() {
  return <PerfilClient />;
}
