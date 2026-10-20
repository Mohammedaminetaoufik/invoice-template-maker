import "../globals.css";
import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/PwaRegister";
import { ROOT_LOCALE_REDIRECT_SCRIPT } from "@/lib/locale-resolution";
import { AnalyticsConsent } from "@/components/AnalyticsConsent";

export const metadata: Metadata = { appleWebApp: { capable: true, title: "InvoiceTemplateMaker", statusBarStyle: "default" } };
export const viewport: Viewport = { themeColor: "#184c49" };

export default function EntryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script id="itm-root-locale-redirect" dangerouslySetInnerHTML={{ __html: ROOT_LOCALE_REDIRECT_SCRIPT }} />
      </head>
      <body><PwaRegister />{children}<AnalyticsConsent locale="en" /></body>
    </html>
  );
}
