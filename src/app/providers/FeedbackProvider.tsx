import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { ConfirmActionOptions, ConfirmDialog } from "../../components/feedback/ConfirmDialog";
import { InlineMessageTone } from "../../components/feedback/InlineMessage";
import { ToastMessage, ToastMessageModel } from "../../components/feedback/ToastMessage";

interface PendingConfirmation extends ConfirmActionOptions {
  resolve: (confirmed: boolean) => void;
}

export interface FeedbackContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
  confirmAction: (options: ConfirmActionOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessageModel[]>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const toastCounter = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (tone: InlineMessageTone, message: string) => {
      const id = `toast-${Date.now()}-${toastCounter.current}`;
      toastCounter.current += 1;

      setToasts((current) => [{ id, tone, message }, ...current].slice(0, 4));
      window.setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast]
  );

  const confirmAction = useCallback((options: ConfirmActionOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setPendingConfirmation({ ...options, resolve });
    });
  }, []);

  const settleConfirmation = useCallback(
    (confirmed: boolean) => {
      if (!pendingConfirmation) return;
      pendingConfirmation.resolve(confirmed);
      setPendingConfirmation(null);
    },
    [pendingConfirmation]
  );

  const value = useMemo<FeedbackContextType>(
    () => ({
      showSuccess: (message) => showToast("success", message),
      showError: (message) => showToast("error", message),
      showInfo: (message) => showToast("info", message),
      showWarning: (message) => showToast("warning", message),
      confirmAction,
    }),
    [confirmAction, showToast]
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div className="fixed top-4 right-4 z-70 w-[min(360px,calc(100vw-2rem))] space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastMessage toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={pendingConfirmation !== null}
        title={pendingConfirmation?.title || ""}
        description={pendingConfirmation?.description}
        confirmLabel={pendingConfirmation?.confirmLabel}
        cancelLabel={pendingConfirmation?.cancelLabel}
        variant={pendingConfirmation?.variant}
        onConfirm={() => settleConfirmation(true)}
        onCancel={() => settleConfirmation(false)}
      />
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
};
