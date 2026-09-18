"use client";

import { createContext, useContext, useMemo, useState } from "react";

type ToastTone = "default" | "success" | "warning";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone?: ToastTone;
};

type ToastContextValue = {
  showToast: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (toast: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3200);
  };

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(360px,calc(100vw-1.5rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              "pointer-events-auto rounded-xl border border-line-strong bg-panel px-3.5 py-3 shadow-[0_16px_36px_rgba(15,15,15,0.18)] backdrop-blur-md animate-toast-in",
              toast.tone === "success" && "border-emerald-400/50",
              toast.tone === "warning" && "border-amber-400/50",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="flex items-start gap-3">
              <div
                className={[
                  "mt-0.5 h-2.5 w-2.5 rounded-full",
                  toast.tone === "success" && "bg-emerald-400",
                  toast.tone === "warning" && "bg-amber-400",
                  !toast.tone || toast.tone === "default" ? "bg-gold" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-paper">{toast.title}</div>
                {toast.description && (
                  <div className="mt-0.5 text-[12px] text-paper/60">{toast.description}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
