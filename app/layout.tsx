import type { Metadata, Viewport } from "next";
import { Courier_Prime, Familjen_Grotesk } from "next/font/google";
import AppShell from "@/components/AppShell";
import "./globals.css";

const familjen = Familjen_Grotesk({ subsets: ["latin"], variable: "--font-familjen", display: "swap" });
const courier = Courier_Prime({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-courier", display: "swap" });

export const metadata: Metadata = {
  title: "PaperTrail — quotes and invoices for small businesses",
  description:
    "Professional quotes and invoices in rand, with 15% VAT, numbering, part payments, WhatsApp reminders and PDF downloads, in English or Afrikaans.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef2f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1628" },
  ],
};

// Applies the saved (or the device's) light/dark theme before the page is drawn, so there's no flash
const themeScript = `try{var t=localStorage.getItem("papertrail:theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className={`${familjen.variable} ${courier.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
