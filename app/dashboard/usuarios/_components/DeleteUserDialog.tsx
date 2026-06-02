"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog, DialogContent, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ApiUser } from "@/lib/api/users";

interface Props {
  user: ApiUser | null;
  onClose: () => void;
  onConfirm: (userId: string) => Promise<unknown>;
}

export function DeleteUserDialog({ user, onClose, onConfirm }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) setIsLoading(false);
  }, [user]);

  const handleConfirm = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await onConfirm(user.id);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email;

  return (
    <Dialog open={!!user} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[420px]">
        <div className="text-center py-2">
          <div className="inline-flex items-center justify-center w-13 h-13 rounded-full bg-amber-50 dark:bg-amber-950/40 mb-4">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Excluir usuário?</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Você está prestes a excluir{" "}
            <strong className="text-foreground">{fullName}</strong>. Esta ação não pode ser desfeita.
          </p>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={handleConfirm} isLoading={isLoading}>
            {isLoading ? "Excluindo…" : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
