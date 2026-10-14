"use client";
import { useEffect, useRef, type ReactNode } from "react";

export function TemplatePreviewDialog({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement;
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    return () => { dialog?.close?.(); if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className="template-preview-dialog" aria-label={label} onCancel={onClose} onClose={onClose}>{children}</dialog>;
}
