import "../../globals.css";
import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PwaRegister } from "@/components/PwaRegister";
import { AnalyticsConsent } from "@/components/AnalyticsConsent";

export const metadata: Metadata = { appleWebApp: { capable: true, title: "InvoiceTemplateMaker", statusBarStyle: "default" } };
export const viewport: Viewport = { themeColor: "#184c49" };

export default function FrenchLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><PwaRegister /><Header locale="fr" />{children}<Footer locale="fr" /><AnalyticsConsent locale="fr" /></body></html>;
}
