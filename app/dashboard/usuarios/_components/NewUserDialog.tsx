"use client";

import { useState, useEffect } from "react";
import { Mail } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { CreateUserPayload } from "@/lib/api/users";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (data: CreateUserPayload) => Promise<unknown>;
}

export function NewUserDialog({ open, onClose, onCreate }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [group, setGroup] = useState("QA");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setFirstName(""); setLastName(""); setEmail("");
      setGroup("QA"); setIsLoading(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onCreate({ first_name: firstName, last_name: lastName, email, group });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = firstName.trim() && email.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
          <DialogDescription>
            O usuário receberá um e-mail com um link para definir a própria senha.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Maria" />
            </div>
            <div className="space-y-1.5">
              <Label>Sobrenome</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Oliveira" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maria.oliveira@tjgo.jus.br"
              startContent={<Mail size={15} className="text-muted-foreground" />}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Perfil</Label>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="QA">QA</SelectItem>
                <SelectItem value="Visualizador">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} isLoading={isLoading} disabled={!canSubmit}>
            {isLoading ? "Criando…" : "Criar usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
