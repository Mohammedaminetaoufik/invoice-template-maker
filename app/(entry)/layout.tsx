import "../globals.css";
import { ROOT_LOCALE_REDIRECT_SCRIPT } from "@/lib/locale-resolution";

export default function EntryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script id="itm-root-locale-redirect" dangerouslySetInnerHTML={{ __html: ROOT_LOCALE_REDIRECT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
