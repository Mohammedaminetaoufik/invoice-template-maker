import { ArrowRight, Check } from "lucide-react";
import { pageContent } from "@/lib/content";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { PageKey } from "@/lib/routes";
import { routeMap } from "@/lib/routes";
import { InvoiceBuilder } from "./InvoiceBuilder";
import { TemplateGallery } from "./MarketingSections";

export function ContentPage({ locale, pageKey }: { locale: Locale; pageKey: PageKey }) {
  const content = pageContent[locale][pageKey];
  const t = getDictionary(locale);
  const isLegal = pageKey === "privacy" || pageKey === "terms" || pageKey === "about" || pageKey === "contact";
  const showBuilder = ["simple", "freelance", "logo"].includes(pageKey);
  return (
    <main>
      <section className={isLegal ? "content-hero legal-hero" : "content-hero"}>
        <div className="shell content-hero-inner">
          <span className="eyebrow">{content.eyebrow}</span><h1>{content.h1}</h1><p>{content.intro}</p>
          {!isLegal && <div className="content-hero-actions"><a className="button" href={showBuilder ? "#generator" : routeMap.home[locale]}>{t.hero.primary}<ArrowRight size={18} /></a>{pageKey !== "templates" && <a className="button button-ghost" href={routeMap.templates[locale]}>{t.hero.secondary}</a>}</div>}
        </div>
      </section>
      {pageKey === "templates" && <TemplateGallery locale={locale} full />}
      {content.sections.length > 0 && <section className={isLegal ? "prose-section legal-prose" : "prose-section"}><div className="shell prose-grid">{content.sections.map((section, index) => <article key={section.title}><span className="prose-index">{String(index + 1).padStart(2, "0")}</span><div><h2>{section.title}</h2><p>{section.body}</p></div></article>)}</div></section>}
      {showBuilder && <InvoiceBuilder locale={locale} initialTemplate={pageKey === "simple" ? "minimal" : pageKey === "logo" ? "modern" : "freelance"} />}
      {pageKey === "contact" && <div className="shell contact-links"><a className="button" href="https://github.com/Mohammedaminetaoufik/invoice-template-maker/issues" target="_blank" rel="noopener noreferrer">{locale === "fr" ? "Signaler un problème sur GitHub" : "Report an issue on GitHub"}</a><a className="button button-ghost" href="https://ternyxa.com" target="_blank" rel="noopener noreferrer">{t.footer.discover}</a></div>}
      {pageKey === "guide" && <section className="guide-checklist"><div className="shell"><h2>{locale === "fr" ? "Avant d’envoyer" : "Before you send"}</h2><div>{(locale === "fr" ? ["Coordonnées vérifiées", "Numéro unique", "Calculs relus", "Échéance claire", "Instructions de paiement ajoutées", "Règles locales vérifiées"] : ["Contact details checked", "Unique number assigned", "Calculations reviewed", "Due date is clear", "Payment instructions added", "Local requirements checked"]).map((item) => <span key={item}><Check size={16} />{item}</span>)}</div><a className="button" href={routeMap.home[locale]}>{t.hero.primary}</a></div></section>}
    </main>
  );
}
