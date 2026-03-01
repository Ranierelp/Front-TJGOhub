import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import ResponsiveModal from "@/components/common/ResponsiveModal";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: string;
  description?: string;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
  description = "Esta acao pode ser revertida atraves da lixeira.",
  isLoading = false,
}: DeleteConfirmationModalProps) {
  return (
    <ResponsiveModal
      footer={
        <>
          <Button
            disabled={isLoading}
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            disabled={isLoading}
            variant="destructive"
            onClick={onConfirm}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </Button>
        </>
      }
      isOpen={isOpen}
      isSubmitting={isLoading}
      size="md"
      title={
        <div className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          Confirmar Exclusao
        </div>
      }
      onClose={onClose}
    >
      <div className="space-y-3">
        <p>
          Tem certeza que deseja excluir {itemType}{" "}
          <strong>{itemName}</strong>?
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </ResponsiveModal>
  );
}