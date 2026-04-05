import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "@/lib/currency-context";
import { LanguageProvider } from "@/lib/language-context";
import { HtmlLangUpdater } from "@/components/html-lang-updater";
import { LangCookieScript } from "@/components/lang-cookie-script";
import AuthProvider from "@/components/auth-provider";
import { AuthLayout } from "@/components/auth-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { PWAProviderLazy } from "@/components/pwa-provider-lazy";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false, // Prevent unused font preload warning — loaded on demand via CSS
});

export const metadata: Metadata = {
  title: "Lockey - Photo Expense Tracker",
  description: "Snap your spending, track your money. A visual personal finance tracker.",
  manifest: `${BASE_PATH}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lockey",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#030712",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <LangCookieScript />
      </head>
      <body className="min-h-full bg-gray-950 text-white">
        <ThemeProvider>
        <PWAProviderLazy>
        <AuthProvider>
          <CurrencyProvider>
            <LanguageProvider>
              <HtmlLangUpdater />
              <AuthLayout>{children}</AuthLayout>
            </LanguageProvider>
          </CurrencyProvider>
        </AuthProvider>
        </PWAProviderLazy>
        </ThemeProvider>
      </body>
    </html>
  );
}
