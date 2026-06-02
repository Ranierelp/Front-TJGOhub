"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ApiUser } from "@/lib/api/users";

const GROUP_VARIANT: Record<string, "default" | "success" | "secondary"> = {
  Admin: "default",
  QA: "success",
  Visualizador: "secondary",
};

const GROUP_DESC: Record<string, string> = {
  Admin: "Acesso total: gerencia usuários, projetos e configurações.",
  QA: "Cria e executa testes; não pode excluir projetos.",
  Visualizador: "Somente leitura em todas as áreas.",
};

const GROUPS = ["Admin", "QA", "Visualizador"];

interface Props {
  user: ApiUser | null;
  onClose: () => void;
  onSave: (userId: string, group: string) => Promise<unknown>;
}

export function ChangeProfileDialog({ user, onClose, onSave }: Props) {
  const [group, setGroup] = useState("QA");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setGroup(user.groups[0]?.name ?? "QA");
      setIsLoading(false);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await onSave(user.id, group);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email;

  return (
    <Dialog open={!!user} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Trocar Perfil</DialogTitle>
          <DialogDescription>Selecione o novo perfil para {fullName}.</DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GROUPS.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Descrição de cada perfil */}
          <div className="space-y-2">
            {GROUPS.map((g) => (
              <div
                key={g}
                className={[
                  "flex gap-2.5 items-start px-3 py-2.5 rounded-lg border transition-colors",
                  g === group
                    ? "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
                    : "border-transparent",
                ].join(" ")}
              >
                <Badge variant={GROUP_VARIANT[g]} className="flex-shrink-0 mt-0.5">{g}</Badge>
                <span className="text-xs text-muted-foreground leading-relaxed">{GROUP_DESC[g]}</span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} isLoading={isLoading}>
            {isLoading ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
