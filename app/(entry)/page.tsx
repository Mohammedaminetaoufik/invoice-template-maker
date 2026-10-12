import type { Metadata } from "next";
import { ArrowRight, FileText } from "lucide-react";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "InvoiceTemplateMaker — Choose Your Language",
  description: "Create a free professional invoice in English or French.",
  alternates: { canonical: `${SITE_URL}/`, languages: { en: `${SITE_URL}/en/`, fr: `${SITE_URL}/fr/`, "x-default": `${SITE_URL}/` } },
};

export default function LanguageEntry() {
  return (
    <main className="entry-page">
      <div className="entry-orb one" /><div className="entry-orb two" />
      <section className="entry-card">
        <a className="brand entry-brand" href="/"><span className="brand-mark"><FileText size={20} /></span>InvoiceTemplateMaker</a>
        <div className="entry-copy"><span className="eyebrow">EN · FR</span><h1>Professional invoices.<br /><em>Votre langue.</em></h1><p>Choose your language to create a free, polished invoice PDF. Choisissez votre langue pour créer gratuitement une facture professionnelle.</p></div>
        <div className="entry-choices"><a href="/en/" lang="en"><span><small>CONTINUE IN</small><strong>English</strong></span><ArrowRight /></a><a href="/fr/" lang="fr"><span><small>CONTINUER EN</small><strong>Français</strong></span><ArrowRight /></a></div>
        <p className="entry-note">Free · Gratuit &nbsp; | &nbsp; No sign-up · Sans inscription</p>
      </section>
    </main>
  );
}
