import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { OneSignalScript } from "@/components/site/onesignal-script";
import { Providers } from "@/components/site/providers";
import { WhatsAppFloatButton } from "@/components/site/whatsapp-float-button";
import { getCurrentUser, getCurrentUserRole } from "@/lib/auth";
import { buildMetadata } from "@/lib/config/site";
import { getHomepageContent, getSiteSettings } from "@/lib/data/queries";

import "./globals.css";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"]
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"]
});

export const metadata: Metadata = buildMetadata();

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [homepage, settings] = await Promise.all([
    getHomepageContent(),
    getSiteSettings()
  ]);
  const [currentUser, currentUserRole] = await Promise.all([getCurrentUser(), getCurrentUserRole()]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable} font-sans antialiased`}>
        <OneSignalScript />
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-hero-glow" />
            <SiteHeader
              homepage={homepage}
              settings={settings}
              currentUser={currentUser}
              currentUserRole={currentUserRole}
            />
            <main className="flex-1">{children}</main>
            <SiteFooter settings={settings} />
            <WhatsAppFloatButton />
          </div>
        </Providers>
      </body>
    </html>
  );
}
