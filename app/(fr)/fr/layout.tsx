import "../../globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function FrenchLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><Header locale="fr" />{children}<Footer locale="fr" /></body></html>;
}
