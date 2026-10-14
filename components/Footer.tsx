import { FileText } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";
import { routeMap } from "@/lib/routes";

export function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <footer className="footer">
      <div className="shell ecosystem-link"><p>{t.footer.ecosystem}</p><a href="https://ternyxa.com" target="_blank" rel="noopener noreferrer">{t.footer.discover} ↗</a></div>
      <div className="shell footer-grid">
        <div>
          <a className="brand footer-brand" href={routeMap.home[locale]}><span className="brand-mark"><FileText size={18} /></span>{t.brand}</a>
          <p>{t.footer.tagline}</p>
          <p className="footer-disclaimer">{t.footer.disclaimer}</p>
        </div>
        <div><h3>{t.footer.product}</h3><a href={routeMap.home[locale]}>{t.nav.generator}</a><a href={routeMap.templates[locale]}>{t.nav.templates}</a><a href={routeMap.simple[locale]}>{t.nav.simple}</a></div>
        <div><h3>{t.footer.resources}</h3><a href={routeMap.freelance[locale]}>{t.nav.freelance}</a><a href={routeMap.logo[locale]}>{locale === "fr" ? "Facture avec logo" : "Invoice with logo"}</a><a href={routeMap.guide[locale]}>{t.nav.guide}</a></div>
        <div><h3>{t.footer.legal}</h3><a href={routeMap.about[locale]}>{t.nav.about}</a><a href={routeMap.contact[locale]}>{t.nav.contact}</a><a href={routeMap.privacy[locale]}>{t.nav.privacy}</a><a href={routeMap.terms[locale]}>{t.nav.terms}</a></div>
      </div>
      <div className="shell footer-bottom"><span>© {new Date().getFullYear()} InvoiceTemplateMaker. {t.footer.rights}</span><span>EN · FR</span></div>
    </footer>
  );
}
