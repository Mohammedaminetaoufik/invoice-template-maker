import { ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { pageContent } from "@/lib/content";
import { routeMap } from "@/lib/routes";
import { PaymentReminderGenerator } from "./PaymentReminderGenerator";

const content = {
  en: {
    kicker: "Free · Private · No signup", intro: "Create a clear payment reminder for an upcoming or overdue invoice. Choose a tone, review the result, and copy it—your invoice details stay in your browser.",
    sections: [
      ["What is a late payment reminder?", "A late payment reminder is a short, factual message that identifies an invoice and asks the client to confirm its payment status. A useful reminder includes the reference, outstanding balance, due date, and one clear next action."],
      ["When should you send one?", "A courtesy note can be sent before the due date. On the due date, ask whether payment is scheduled without calling it late. Once the date has passed, follow up promptly and space later reminders according to your agreement and client relationship."],
      ["Friendly, professional, or firm?", "Use a friendly tone for a first follow-up with a reliable client. Choose professional when you need a direct status update. A firm reminder is appropriate after earlier attempts, but should remain factual and avoid threats or unverified legal claims."],
      ["Make the message easy to act on", "Check the remaining balance after any partial payment, mention the invoice number, and ask for a payment date. Add concise payment instructions only when useful. Never put private banking data in the email subject."],
      ["Common mistakes to avoid", "Do not describe a future invoice as overdue, demand an amount already paid, or bury the request in a long message. Review the generated email before sending and adapt it to the context. This tool does not provide legal or debt-collection advice."],
    ],
    faqTitle: "Payment reminder questions", faqs: [
      ["Does the tool send an email?", "No. It only prepares text. Opening your email application or sending a message always requires your action."],
      ["Are my invoice details uploaded?", "No. Generation and invoice handoff happen locally in your browser, without placing details in the URL."],
      ["What if the invoice is not due yet?", "The wording changes to a courtesy reminder and does not claim that payment is overdue."],
      ["What if the balance is zero?", "The tool marks the invoice paid in full and disables copy and email actions for a payment demand."],
    ],
    guide: "Read the complete reminder guide", invoice: "Create a professional invoice", built: "Built by Ternyxa",
  },
  fr: {
    kicker: "Gratuit · Confidentiel · Sans inscription", intro: "Créez un mail de relance clair pour une facture à venir ou échue. Choisissez le ton, relisez le résultat et copiez-le : vos données restent dans votre navigateur.",
    sections: [
      ["Qu’est-ce qu’une relance de paiement ?", "Une relance est un message court et factuel qui identifie une facture et demande au client de confirmer son règlement. Elle indique utilement la référence, le solde restant, l’échéance et l’action attendue."],
      ["Quand envoyer une relance ?", "Un rappel de courtoisie peut précéder l’échéance. Le jour même, demandez si le paiement est programmé sans parler de retard. Une fois la date dépassée, relancez rapidement puis espacez les suivis selon votre accord et la relation client."],
      ["Ton cordial, professionnel ou ferme ?", "Le ton cordial convient au premier suivi d’un client habituellement fiable. Le ton professionnel demande une réponse directe. Une relance ferme intervient après plusieurs tentatives, mais reste factuelle, sans menace ni affirmation juridique non vérifiée."],
      ["Faciliter le règlement", "Vérifiez le solde après tout paiement partiel, rappelez le numéro de facture et demandez une date précise. Ajoutez seulement les modalités utiles et ne placez jamais de données bancaires privées dans l’objet du mail."],
      ["Erreurs courantes à éviter", "Ne qualifiez pas une facture à venir d’impayée, ne réclamez pas un montant déjà réglé et ne cachez pas votre demande dans un texte trop long. Relisez toujours le message. Cet outil ne fournit aucun conseil juridique ni service de recouvrement."],
    ],
    faqTitle: "Questions sur les relances", faqs: [
      ["L’outil envoie-t-il le mail ?", "Non. Il prépare uniquement le texte. L’ouverture de la messagerie et l’envoi nécessitent toujours une action de votre part."],
      ["Mes données sont-elles transférées ?", "Non. La génération et le transfert depuis la facture restent locaux dans le navigateur, sans information personnelle dans l’URL."],
      ["Et si l’échéance n’est pas dépassée ?", "Le texte devient un rappel de courtoisie et n’affirme pas que la facture est en retard."],
      ["Et si le solde est nul ?", "L’outil indique que la facture est réglée et désactive les actions qui réclameraient un paiement."],
    ],
    guide: "Lire le guide complet de la relance", invoice: "Créer une facture professionnelle", built: "Créé par Ternyxa",
  },
} as const;

export function PaymentReminderPage({ locale }: { locale: Locale }) {
  const c = content[locale];
  const meta = pageContent[locale].reminder;
  return <main>
    <section className="content-hero reminder-hero"><div className="shell content-hero-inner"><span className="eyebrow">{c.kicker}</span><h1>{meta.h1}</h1><p>{c.intro}</p><div className="content-hero-actions"><a className="button button-ghost" href={routeMap.home[locale]}>{locale === "fr" ? "Créer d’abord une facture" : "Create an invoice first"}<ArrowRight size={16} /></a></div></div></section>
    <PaymentReminderGenerator locale={locale} />
    <section className="reminder-content"><div className="shell reminder-content-grid">{c.sections.map(([title, body]) => <article key={title}><h2>{title}</h2><p>{body}</p></article>)}</div></section>
    <section className="faq-section reminder-faq"><div className="shell faq-grid"><div className="section-heading sticky-heading"><span className="eyebrow">FAQ</span><h2>{c.faqTitle}</h2></div><div className="faq-list">{c.faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></div></section>
    <section className="related-journey"><div className="shell"><a href={routeMap.reminderArticle[locale]}>{c.guide}<ArrowRight size={16} /></a><a href={routeMap.home[locale]}>{c.invoice}<ArrowRight size={16} /></a><a href="https://ternyxa.com/" target="_blank" rel="noopener noreferrer">{c.built}<ArrowRight size={16} /></a></div></section>
  </main>;
}
