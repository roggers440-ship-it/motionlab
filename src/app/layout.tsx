import type { Metadata, Viewport } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/noto-sans-devanagari";
import "./globals.css";
import { Providers } from "@/providers/Providers";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { PerfHUD } from "@/components/perf/PerfHUD";

export const metadata: Metadata = {
  title: {
    default: "MotionLab — the web animation lab",
    template: "%s · MotionLab",
  },
  description:
    "A production-grade animation hub: UI physics, scroll timelines, shared-canvas WebGL, Rive/Lottie state machines, shaders, simulations and native web motion — with live playground controls and a perf HUD.",
};

export const viewport: Viewport = {
  themeColor: "#07070b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
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
