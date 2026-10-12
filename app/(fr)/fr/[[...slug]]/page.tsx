import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { HomePage } from "@/components/HomePage";
import { StructuredData } from "@/components/StructuredData";
import { pageMetadata } from "@/lib/seo";
import { pageKeyFromSlug, routeMap, type PageKey } from "@/lib/routes";

type Props = { params: Promise<{ slug?: string[] }> };

export function generateStaticParams() {
  return (Object.keys(routeMap) as PageKey[]).map((key) => {
    const slug = routeMap[key].fr.replace(/^\/fr\/?|\/$/g, "");
    return { slug: slug ? slug.split("/") : [] };
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const key = pageKeyFromSlug("fr", slug);
  return key ? pageMetadata("fr", key) : {};
}

export default async function FrenchPage({ params }: Props) {
  const { slug } = await params;
  const key = pageKeyFromSlug("fr", slug);
  if (!key) notFound();
  return <><StructuredData locale="fr" pageKey={key} />{key === "home" ? <HomePage locale="fr" /> : <ContentPage locale="fr" pageKey={key} />}</>;
}
