import { getDictionary, type Locale } from "@/lib/i18n";
import { routeMap } from "@/lib/routes";
import { HomeWorkspace } from "./HomeWorkspace";
import { MarketingSections } from "./MarketingSections";
import { AdvertisingSlot } from "./AdvertisingSlot";
import { getEditorCopy } from "@/lib/editor-copy";
import { TernyxaDiscovery } from "./TernyxaDiscovery";
import { FrenchHomeGrowth } from "./FrenchHomeGrowth";

export function HomePage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const copy = getEditorCopy(locale);
  return <HomeWorkspace locale={locale} intro={<section className="generator-intro shell">
      <span className="eyebrow">{t.hero.eyebrow}</span>
      <h1>{copy.hero}</h1>
      <p>{copy.intro}</p>
      <div className="hero-actions"><a className="button" href="#generator">{copy.primary}</a><a className="button button-ghost" href={routeMap.templates[locale]}>{copy.secondary}</a></div>
      <ul className="product-trust">{copy.trust.map((point) => <li key={point}>{point}</li>)}</ul>
      <nav className="home-task-links" aria-label={locale === "fr" ? "Créer une facture selon votre besoin" : "Create an invoice for your needs"}><a href={routeMap.logo[locale]}>{locale === "fr" ? "Créer une facture avec logo" : "Customize an invoice with your logo"}</a><a href={routeMap.simple[locale]}>{locale === "fr" ? "Utiliser un modèle de facture simple gratuit" : "Use a free simple invoice template"}</a></nav>
      <div className="audience-strip"><h2>{copy.audience}</h2><p>{copy.audiences.join(" · ")}</p></div>
    </section>} information={<>{locale === "fr" && <FrenchHomeGrowth />}<AdvertisingSlot position="after-generator" /><MarketingSections locale={locale} /><AdvertisingSlot position="after-content" /></>} discovery={<TernyxaDiscovery locale={locale} />} />;
}
