import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Sora } from "next/font/google";
import Script from "next/script";
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { ScrollRestoration } from "./scroll-restoration";
import { NavDirectionProvider } from "./nav-direction";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://skills.xingkaixin.com"),
  title: "XingKaiXin's Skills",
  description: "Agent skills for AI Agents",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${sora.variable} ${cormorant.variable} ${ibmPlexMono.variable} antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="font-sans min-h-screen">
        <MotionConfig reducedMotion="user">
          <NavDirectionProvider>
            <ScrollRestoration />
            {children}
          </NavDirectionProvider>
        </MotionConfig>
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="3cc75249-f08d-4bb4-8fa1-975d39218795"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
