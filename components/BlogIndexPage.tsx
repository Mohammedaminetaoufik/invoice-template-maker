import { ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { pageContent } from "@/lib/content";
import { reminderArticles } from "@/lib/blog";
import { routeMap } from "@/lib/routes";

export function BlogIndexPage({ locale }: { locale: Locale }) {
  const meta = pageContent[locale].blog;
  const article = reminderArticles[locale];
  return <main>
    <section className="content-hero blog-hero"><div className="shell content-hero-inner"><span className="eyebrow">{meta.eyebrow}</span><h1>{meta.h1}</h1><p>{meta.intro}</p></div></section>
    <section className="blog-index"><div className="shell"><article className="article-card"><div><span className="eyebrow">{article.eyebrow}</span><h2><a href={routeMap.reminderArticle[locale]}>{article.title}</a></h2><p>{article.description}</p><div className="article-meta"><span>{article.publisher}</span><span>{article.readingTime}</span></div><a className="article-link" href={routeMap.reminderArticle[locale]}>{locale === "fr" ? "Lire le guide" : "Read the guide"}<ArrowRight size={16} /></a></div><aside><strong>01</strong><span>{locale === "fr" ? "Relances de paiement" : "Payment reminders"}</span></aside></article></div></section>
    <section className="related-journey"><div className="shell"><a href={routeMap.reminder[locale]}>{locale === "fr" ? "Créer une relance" : "Create a reminder"}<ArrowRight size={16} /></a><a href={routeMap.home[locale]}>{locale === "fr" ? "Créer une facture" : "Create an invoice"}<ArrowRight size={16} /></a><a href="https://ternyxa.com/" target="_blank" rel="noopener noreferrer">{locale === "fr" ? "Un outil Ternyxa" : "A Ternyxa tool"}<ArrowRight size={16} /></a></div></section>
  </main>;
}
