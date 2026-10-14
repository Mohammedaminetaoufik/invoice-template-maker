"use client";

import { useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { InvoiceBuilder } from "./InvoiceBuilder";

// Server-rendered marketing/SEO slots remain crawlable; only their result-state
// placement changes. Invoice state stays inside the existing builder.
export function HomeWorkspace({ locale, intro, information, discovery }: { locale: Locale; intro: ReactNode; information: ReactNode; discovery: ReactNode }) {
  const [completed, setCompleted] = useState(false);
  return <main data-invoice-complete={completed}>
    {intro}
    <InvoiceBuilder locale={locale} onResultChange={setCompleted} />
    {completed && discovery}
    {information}
    {!completed && discovery}
  </main>;
}
