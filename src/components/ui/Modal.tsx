"use client";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-3 sm:items-center sm:p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-[420px] overflow-y-auto rounded-sm border border-line-strong bg-elevated p-5 sm:max-h-[calc(100dvh-2.5rem)] sm:p-7">
        <h3 className="font-display text-[19px] mb-4.5">{title}</h3>
        {children}
      </div>
    </div>
  );
}
