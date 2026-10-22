import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { HomePage } from "@/components/HomePage";
import { StructuredData } from "@/components/StructuredData";
import { PaymentReminderPage } from "@/components/PaymentReminderPage";
import { BlogIndexPage } from "@/components/BlogIndexPage";
import { BlogArticlePage } from "@/components/BlogArticlePage";
import { InvoiceGuidePage } from "@/components/InvoiceGuidePage";
import { SimpleInvoicePage } from "@/components/SimpleInvoicePage";
import { LogoInvoicePage } from "@/components/LogoInvoicePage";
import { pageMetadata } from "@/lib/seo";
import { pageKeyFromSlug, routeMap, type PageKey } from "@/lib/routes";

type Props = { params: Promise<{ slug?: string[] }> };

export function generateStaticParams() {
  return (Object.keys(routeMap) as PageKey[]).map((key) => {
    const slug = routeMap[key].en.replace(/^\/en\/?|\/$/g, "");
    return { slug: slug ? slug.split("/") : [] };
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const key = pageKeyFromSlug("en", slug);
  return key ? pageMetadata("en", key) : {};
}

export default async function EnglishPage({ params }: Props) {
  const { slug } = await params;
  const key = pageKeyFromSlug("en", slug);
  if (!key) notFound();
  const page = key === "home" ? <HomePage locale="en" /> : key === "guide" ? <InvoiceGuidePage locale="en" /> : key === "simple" ? <SimpleInvoicePage locale="en" /> : key === "logo" ? <LogoInvoicePage locale="en" /> : key === "reminder" ? <PaymentReminderPage locale="en" /> : key === "blog" ? <BlogIndexPage locale="en" /> : key === "reminderArticle" ? <BlogArticlePage locale="en" /> : <ContentPage locale="en" pageKey={key} />;
  return <><StructuredData locale="en" pageKey={key} />{page}</>;
}
