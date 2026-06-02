"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useAuthStore, mapApiUserToUser } from "@/stores/authStore";
import { updateMe } from "@/lib/api/users";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const GROUP_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  admin:        "default",
  Admin:        "default",
  qa:           "success",
  QA:           "success",
  visualizador: "secondary",
  Visualizador: "secondary",
};

export default function PerfilClient() {
  const { user } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [savingInfo, setSavingInfo] = useState(false);

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  const groupName = user?.roles?.find(
    (r) => r !== "admin" && r !== "staff" && r !== "user",
  );

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    try {
      const res = await updateMe({ first_name: firstName, last_name: lastName });
      // Usa a resposta real do servidor — fonte da verdade
      if (res.data) setUser(mapApiUserToUser(res.data));
      toast.success("Dados atualizados com sucesso.");
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSavingInfo(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2.5">
        <span>Dashboard</span>
        <span className="opacity-60">›</span>
        <span className="text-foreground font-semibold">Meu Perfil</span>
      </div>

      <h1 className="text-[22px] font-extrabold tracking-tight text-foreground mb-6">
        Meu Perfil
      </h1>

      {/* Card: Informações da Conta */}
      <Card className="mb-4">
        <CardContent className="pt-6 flex items-center gap-5">
          <Avatar className="h-[72px] w-[72px] text-2xl font-bold bg-blue-600 text-white flex-shrink-0">
            <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xl font-bold text-foreground tracking-tight">
              {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email}
            </p>
            <p className="text-[13.5px] text-muted-foreground font-mono mt-0.5 mb-2.5">
              {user?.email}
            </p>
            {groupName ? (
              <Badge variant={GROUP_VARIANT[groupName] ?? "outline"}>
                {groupName.charAt(0).toUpperCase() + groupName.slice(1)}
              </Badge>
            ) : (
              <Badge variant="outline">Sem perfil</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card: Dados Pessoais */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
          <CardDescription>Edite seu nome de exibição.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pf-first">Nome</Label>
              <Input
                id="pf-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pf-last">Sobrenome</Label>
              <Input
                id="pf-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveInfo} isLoading={savingInfo}>
            {savingInfo ? "Salvando…" : "Salvar alterações"}
          </Button>
        </CardFooter>
      </Card>

    </div>
  );
}
