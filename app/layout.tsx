import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SITE_URL } from "@/lib/site-url";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "Vialé — Luxury Fragrance Decants | Niche & Designer Samples";
const description =
  "Explore 200+ niche & designer fragrances as authentic, hand-poured decants from ₹1,160. Find your signature scent before committing to a full bottle — shipped fast across India.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Plain default title — individual pages already self-brand (e.g. "Cart —
  // Viale"), so a "%s · Vialé" template would double-brand them.
  title,
  description,
  applicationName: "Vialé",
  category: "shopping",
  keywords: [
    "fragrance decants",
    "perfume samples",
    "niche fragrances",
    "designer perfumes",
    "perfume decants India",
    "luxury fragrances",
    "luxury decants",
    "buy perfume samples online",
    "Vialé",
  ],
  authors: [{ name: "Vialé" }],
  creator: "Vialé",
  publisher: "Vialé",
  alternates: { canonical: "/" },
  // Icons (favicon.ico, icon.png, apple-icon.png) and social images
  // (opengraph-image.png, twitter-image.png) are auto-wired from the app/
  // directory via Next.js file conventions, so they are not listed here.
  openGraph: {
    type: "website",
    siteName: "Vialé",
    title: "Vialé — Luxury Fragrance Decants",
    description:
      "Try 60+ niche & designer fragrances without the full-bottle commitment. Authentic, hand-poured decants from ₹500 — shipped fast across India.",
    url: "/",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vialé — Luxury Fragrance Decants",
    description:
      "Try 60+ niche & designer fragrances without the full-bottle commitment. Authentic, hand-poured decants from ₹500.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF7F1" },
    { media: "(prefers-color-scheme: dark)", color: "#1C1917" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable, cormorantGaramond.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
