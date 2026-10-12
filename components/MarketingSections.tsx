import { ArrowRight, Check, FileCheck2, Palette, Send } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";
import { routeMap } from "@/lib/routes";

export function TemplateGallery({ locale, full = false }: { locale: Locale; full?: boolean }) {
  const t = getDictionary(locale);
  const ids = ["modern", "minimal", "classic"] as const;
  return (
    <section className="marketing-section templates-showcase">
      <div className="shell">
        <div className="section-heading"><span className="eyebrow">{t.templatesSection.eyebrow}</span><h2>{t.templatesSection.title}</h2><p>{t.templatesSection.body}</p></div>
        <div className="template-cards">
          {ids.map((id, index) => (
            <article className="template-card" key={id}>
              <div className={`template-art art-${id}`}><div className="art-paper"><i /><b /><span /><span /><span /><em /></div></div>
              <div className="template-card-copy"><span className="template-number">0{index + 1}</span><h3>{t.templatesSection.names[index]}</h3><p>{t.templatesSection.descriptions[index]}</p><a href={`${routeMap.home[locale]}?template=${id}#generator`}>{t.templatesSection.use}<ArrowRight size={15} /></a></div>
            </article>
          ))}
        </div>
        {full && <div className="content-callout"><Check size={20} /><p>{locale === "fr" ? "Le changement de modèle conserve les coordonnées, lignes, paramètres et préférences linguistiques de votre facture." : "Switching templates preserves your invoice contacts, line items, settings, and language preferences."}</p></div>}
      </div>
    </section>
  );
}

export function MarketingSections({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const icons = [FileCheck2, Palette, Send];
  return (
    <>
      <TemplateGallery locale={locale} />
      <section className="marketing-section how-section"><div className="shell"><div className="section-heading"><span className="eyebrow">{t.how.eyebrow}</span><h2>{t.how.title}</h2></div><div className="steps-grid">{t.how.steps.map(([title, body], i) => { const Icon = icons[i]; return <article key={title}><span className="step-icon"><Icon size={22} /></span><small>0{i + 1}</small><h3>{title}</h3><p>{body}</p></article>; })}</div></div></section>
      <section className="marketing-section faq-section"><div className="shell faq-grid"><div className="section-heading sticky-heading"><span className="eyebrow">{t.faqs.eyebrow}</span><h2>{t.faqs.title}</h2><p>{locale === "fr" ? "Tout ce qu’il faut savoir avant de créer votre première facture." : "Everything you need to know before making your first invoice."}</p></div><div className="faq-list">{t.faqs.items.map(([question, answer], i) => <details key={question} open={i === 0}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></div></section>
      <section className="cta-section"><div className="shell cta-card"><span className="eyebrow">{locale === "fr" ? "Prêt à facturer ?" : "Ready to invoice?"}</span><h2>{locale === "fr" ? "Créez une facture claire aujourd’hui." : "Create a clearer invoice today."}</h2><p>{locale === "fr" ? "Aucune inscription. Aucun abonnement. Votre PDF en quelques minutes." : "No registration. No subscription. Just a professional PDF in minutes."}</p><a className="button button-light" href="#generator">{t.hero.primary}<ArrowRight size={18} /></a></div></section>
    </>
  );
}
