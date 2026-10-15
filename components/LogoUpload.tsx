"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import { deleteLogo, loadLogo, prepareLogo, saveLogo, type InvoiceLogo } from "@/lib/logo";

export function LogoUpload({ locale, logoId, onChange, onPreview, onBusyChange, focusRequested }: { locale: Locale; logoId?: string; onChange: (id: string | undefined) => void; onPreview: (url: string | undefined) => void; onBusyChange?: (busy: boolean) => void; focusRequested?: boolean }) {
  const t = getDictionary(locale).builder;
  const [logo, setLogo] = useState<InvoiceLogo>();
  const [url, setUrl] = useState<string>();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (focusRequested) { input.current?.focus(); input.current?.scrollIntoView({ block: "center" }); } }, [focusRequested]);

  useEffect(() => {
    let active = true;
    setLogo(undefined);
    if (logoId) loadLogo(logoId).then((saved) => { if (active) { setLogo(saved); setError(!saved); } }).catch(() => { if (active) setError(true); });
    else setError(false);
    return () => { active = false; };
  }, [logoId]);

  useEffect(() => {
    if (!logo) { setUrl(undefined); onPreview(undefined); return; }
    const next = URL.createObjectURL(new Blob([new Uint8Array(logo.bytes)], { type: "image/png" }));
    setUrl(next); onPreview(next);
    return () => URL.revokeObjectURL(next);
  }, [logo, onPreview]);

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true); onBusyChange?.(true); setError(false);
    try {
      const next = await prepareLogo(file);
      await saveLogo(next);
      onChange(next.id); setLogo(next);
      if (logoId) await deleteLogo(logoId).catch(() => {});
    } catch { setError(true); }
    finally { setBusy(false); onBusyChange?.(false); if (input.current) input.current.value = ""; }
  }

  async function remove() {
    const previous = logoId;
    onChange(undefined); setLogo(undefined);
    if (previous) await deleteLogo(previous).catch(() => {});
  }

  return <div className="logo-control">
    <label><span>{t.logo}</span><input ref={input} type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(event) => upload(event.target.files?.[0])} /><small>{t.logoHelp}</small></label>
    {logoId && <div className="logo-upload-preview">{url && <img src={url} alt={t.logo} />}<button className="text-button" type="button" onClick={remove}>{t.removeLogo}</button></div>}
    {busy && <p role="status">{t.preparingLogo}</p>}
    {error && <p className="form-status status-error" role="alert">{t.logoError}</p>}
  </div>;
}
