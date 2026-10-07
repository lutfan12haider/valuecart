import type { Metadata, Viewport } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const name = process.env.NEXT_PUBLIC_STORE_NAME ?? "ValueCart";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: `${name} - Affordable products, delivered worldwide`, template: `%s | ${name}` },
  description: "Shop affordable products across many categories with worldwide shipping.",
  openGraph: { siteName: name, type: "website" }
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <SiteHeader />
        <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-6">{children}</main>
        <footer className="mt-10 border-t bg-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm text-slate-600 sm:grid-cols-3">
            <div>
              <p className="font-bold text-brand">{name}</p>
              <p>Affordable products, worldwide shipping.</p>
            </div>
            <div className="flex flex-col gap-1">
              <Link href="/pages/shipping-policy">Shipping Policy</Link>
              <Link href="/pages/return-refund-policy">Return and Refund Policy</Link>
              <Link href="/pages/privacy-policy">Privacy Policy</Link>
            </div>
            <div className="flex flex-col gap-1">
              <Link href="/pages/about-us">About Us</Link>
              <Link href="/contact">Contact Us</Link>
              <Link href="/pages/faq">FAQ</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
