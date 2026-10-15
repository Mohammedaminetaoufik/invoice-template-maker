import { BriefcaseBusiness, FileText, Image, QrCode } from "lucide-react";
import { getEditorCopy } from "@/lib/editor-copy";
import type { Locale } from "@/lib/i18n";

export function TernyxaDiscovery({ locale }: { locale: Locale }) {
  const copy = getEditorCopy(locale);
  const icons = [QrCode, Image, FileText, BriefcaseBusiness];
  return <section className="ternyxa-discovery"><div className="shell ternyxa-card">
    <div><span className="eyebrow">{copy.discoverySmall}</span><p className="ternyxa-wordmark">Ternyxa</p><h2>{copy.discoveryTitle}</h2><p>{copy.discoveryBody}</p><a className="button button-light" href="https://ternyxa.com" rel="noreferrer">{copy.discoveryAction}</a></div>
    <div className="ternyxa-features">{copy.discoveryFeatures.map((label, index) => { const Icon = icons[index]; return <div key={label}><Icon size={28} aria-hidden="true" /><span>{label}</span></div>; })}</div>
  </div></section>;
}
