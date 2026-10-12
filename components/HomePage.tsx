import { ArrowRight, Check, LockKeyhole, Sparkles, Zap } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";
import { routeMap } from "@/lib/routes";
import { InvoiceBuilder } from "./InvoiceBuilder";
import { MarketingSections } from "./MarketingSections";

export function HomePage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <>
      <main>
        <section className="hero">
          <div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" />
          <div className="shell hero-grid">
            <div className="hero-copy">
              <span className="eyebrow"><Sparkles size={14} />{t.hero.eyebrow}</span>
              <h1>{t.hero.title}</h1>
              <p className="hero-lead">{t.hero.body}</p>
              <div className="hero-actions"><a className="button" href="#generator">{t.hero.primary}<ArrowRight size={18} /></a><a className="button button-ghost" href={routeMap.templates[locale]}>{t.hero.secondary}</a></div>
              <div className="hero-points">{t.hero.points.map((point) => <span key={point}><Check size={15} />{point}</span>)}</div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="floating-pill pill-top"><Zap size={15} />{locale === "fr" ? "Création instantanée" : "Instant creation"}</div>
              <div className="demo-invoice">
                <div className="demo-head"><div className="demo-logo">N</div><div><b>NORTHSTAR</b><small>CREATIVE STUDIO</small></div><strong>{locale === "fr" ? "FACTURE" : "INVOICE"}</strong></div>
                <div className="demo-lines top"><i /><i /><i /></div>
                <div className="demo-table"><div /><div /><div /><div /></div>
                <div className="demo-totals"><span /><span /><b /></div>
              </div>
              <div className="floating-pill pill-bottom"><LockKeyhole size={15} />{locale === "fr" ? "Données privées" : "Private by design"}</div>
            </div>
          </div>
        </section>
        <div className="trust-strip"><div className="shell"><span>{t.hero.trust}</span><div><b>FREELANCE</b><b>CONSULTING</b><b>STUDIO</b><b>SMALL BUSINESS</b></div></div></div>
        <InvoiceBuilder locale={locale} />
        <MarketingSections locale={locale} />
      </main>
    </>
  );
}
