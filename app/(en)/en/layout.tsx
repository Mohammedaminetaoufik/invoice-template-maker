import "../../globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Header locale="en" />{children}<Footer locale="en" /></body></html>;
}
