import { Trash2 } from "lucide-react";

interface ConfirmModalProps {
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  description,
  confirmLabel = "Excluir",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
      onClick={onCancel}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-destructive" />
          </div>
          <div>
            <p className="font-display font-bold text-base text-foreground">{title}</p>
            <div className="font-body text-sm text-foreground/50 mt-0.5">{description}</div>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-border rounded-xl font-display font-semibold text-sm text-foreground/60 hover:bg-muted/40 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-destructive text-white rounded-xl font-display font-semibold text-sm hover:bg-destructive/90 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
