import type { Metadata, Viewport } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/noto-sans-devanagari";
import "./globals.css";
import { Providers } from "@/providers/Providers";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { PerfHUD } from "@/components/perf/PerfHUD";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url), // makes every relative URL (OG images, canonicals) absolute
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: site.keywords,
  authors: [site.author],
  creator: site.author.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    url: "/",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#07070b",
  colorScheme: "dark",
};

// Structured data: tells Google who made the site and what it is.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  url: site.url,
  description: site.description,
  inLanguage: "en",
  author: {
    "@type": "Person",
    name: site.author.name,
    url: site.author.url,
    jobTitle: "Frontend Engineer",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kathmandu",
      addressCountry: "NP",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] btn btn-primary"
        >
          Skip to content
        </a>
        <Providers>
          <SiteHeader />
          <main id="main">{children}</main>
          <PerfHUD />
        </Providers>
      </body>
    </html>
  );
}
