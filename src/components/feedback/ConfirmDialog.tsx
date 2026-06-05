import React, { useEffect, useId, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

export interface ConfirmActionOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
}

interface ConfirmDialogProps extends ConfirmActionOptions {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelButtonRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-rose-600 hover:bg-rose-500 text-white"
      : "bg-indigo-600 hover:bg-indigo-500 text-white";

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 animate-fade-in">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs w-full h-full cursor-default"
        onClick={onCancel}
        aria-label="Close confirmation dialog"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden"
      >
        <div className="flex items-start gap-3 p-5 border-b border-slate-100 dark:border-slate-800">
          <span
            className={`p-2 rounded-xl shrink-0 ${
              variant === "danger"
                ? "bg-rose-50 dark:bg-rose-950/20 text-rose-500"
                : "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <h2 id={titleId} className="text-sm font-bold text-slate-950 dark:text-white">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-end gap-2 p-4">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
};
