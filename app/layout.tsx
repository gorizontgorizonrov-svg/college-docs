import type { Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { OfflineNotice } from "@/components/OfflineNotice";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LayoutShell } from "@/components/LayoutShell";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import { getDict } from "@/lib/i18n/getDict";
import type { Locale } from "@/lib/i18n/config";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export async function generateMetadata() {
  const locale = await getLocale();
  const labels: Record<Locale, string> = {
    ru: "СЭД ЖАК ЖАГУ — Электронный документооборот",
    ky: "ЭДС ЖАК ЖАМУ — Электрондук документ жүгүртүү",
    en: "DMS JAC JAGU — Electronic Document Management",
    zh: "文件管理系统 JAC JAGU — 电子文件管理",
  };
  return {
    title: labels[locale] || labels.ru,
    description: "Автоматизация документооборота Жалал-Абадского колледжа",
    manifest: "/manifest.json",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dict = await getDict(locale);

  return (
    <html lang={locale} className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                  var locale = document.cookie.replace(/(?:(?:^|.*;\\s*)NEXT_LOCALE\\s*\\=\\s*([^;]*).*$)|^.*$/, "$1");
                  if (locale) document.documentElement.lang = locale;
                } catch(e) {}
              })();
            `,
          }}
        />
        <link rel="icon" href="/images/college-logo.svg" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className="min-h-full">
        <SessionProvider>
          <ThemeProvider>
            <I18nProvider initialLocale={locale} initialDict={dict}>
              <OfflineNotice />
              <LayoutShell>{children}</LayoutShell>
            </I18nProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
