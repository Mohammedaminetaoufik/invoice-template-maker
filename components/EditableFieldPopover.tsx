"use client";
import { useEffect, useRef, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { getEditorCopy } from "@/lib/editor-copy";

export function EditableFieldPopover({ label, locale, alignRight, anchor, onClose, children }: { label: string; locale: Locale; alignRight: boolean; anchor: () => HTMLButtonElement | null | undefined; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const copy = getEditorCopy(locale);
  useEffect(() => {
    const viewport = window.visualViewport;
    const position = () => {
      const sheet = ref.current;
      if (!sheet) return;
      if (!window.matchMedia?.("(max-width: 760px)").matches) {
        sheet.style.removeProperty("--keyboard-inset");
        sheet.style.removeProperty("max-height");
        return;
      }
      const height = viewport?.height ?? window.innerHeight;
      const offset = viewport?.offsetTop ?? 0;
      const keyboardInset = Math.max(0, window.innerHeight - height - offset);
      sheet.style.setProperty("--keyboard-inset", `${keyboardInset}px`);
      sheet.style.maxHeight = `${Math.min(300, height * .55)}px`;
      const target = anchor();
      if (target) {
        const top = target.getBoundingClientRect().top;
        const desired = offset + 70 + Math.max(0, (height - sheet.offsetHeight - 90) / 2);
        if (Math.abs(top - desired) > 4) window.scrollBy({ top: top - desired, behavior: "instant" });
      }
    };
    const frame = window.setTimeout(position, 0);
    viewport?.addEventListener("resize", position);
    window.addEventListener("resize", position);
    return () => { window.clearTimeout(frame); viewport?.removeEventListener("resize", position); window.removeEventListener("resize", position); };
    // A new contextual editor mounts for each field; typing must not re-scroll.
  }, []);
  return <div ref={ref} className={`field-popover ${alignRight ? "align-right" : ""}`} role="dialog" aria-label={label} onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}>
    <div className="field-popover-heading"><span>{label}</span><button className="field-close" type="button" aria-label={copy.close} onClick={onClose}>×</button></div>
    {children}
  </div>;
}
