import type { Viewport } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { OfflineNotice } from "@/components/OfflineNotice";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LayoutShell } from "@/components/LayoutShell";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import { getDict } from "@/lib/i18n/getDict";
import type { Locale } from "@/lib/i18n/config";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const siteUrl = "https://college-docs.vercel.app";

const seoLabels: Record<Locale, { title: string; description: string; keywords: string }> = {
  ru: {
    title: "СЭД ЖАК ЖАГУ — Электронный документооборот",
    description: "Автоматизация документооборота Жалал-Абадского колледжа. Система электронного документооборота ЖАК ЖАГУ.",
    keywords: "СЭД, электронный документооборот, ЖАК, ЖАГУ, Жалал-Абадский колледж, документы, ЭЦП",
  },
  ky: {
    title: "ЭДС ЖАК ЖАМУ — Электрондук документ жүгүртүү",
    description: "Жалал-Абад колледжинин документ жүгүртүүсүн автоматташтыруу. ЖАК ЖАМУ электрондук документ жүгүртүү системасы.",
    keywords: "ЭДС, электрондук документ жүгүртүү, ЖАК, ЖАМУ, Жалал-Абад колледжи, документтер, ЭКП",
  },
  en: {
    title: "DMS JAC JAGU — Electronic Document Management",
    description: "Document management automation for Jalal-Abad College. Electronic document management system of JAC JAGU.",
    keywords: "DMS, document management, JAC, JAGU, Jalal-Abad College, documents, digital signature",
  },
  zh: {
    title: "文件管理系统 JAC JAGU — 电子文件管理",
    description: "贾拉拉巴德学院文件管理自动化。JAC JAGU 电子文件管理系统。",
    keywords: "文件管理, 电子文件, JAC, JAGU, 贾拉拉巴德学院, 文档, 数字签名",
  },
};

export async function generateMetadata() {
  const locale = await getLocale();
  const seo = seoLabels[locale] || seoLabels.ru;

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    manifest: "/manifest.json",
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        (await import("@/lib/i18n/config")).locales.map((l: Locale) => [l, `/${l}`]),
      ),
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `/${locale}`,
      siteName: "СЭД ЖАК ЖАГУ",
      locale: locale === "ky" ? "ky_KG" : locale === "ru" ? "ru_RU" : locale === "zh" ? "zh_CN" : "en_US",
      type: "website",
      images: [
        {
          url: "/images/college-logo.jpg",
          width: 512,
          height: 512,
          alt: "ЖАК ЖАГУ",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: seo.title,
      description: seo.description,
      images: ["/images/college-logo.jpg"],
    },
    other: {
      "og:locale:alternate": "ru_RU, ky_KG, en_US, zh_CN",
    },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["EducationalOrganization", "Organization"],
              name: "ЖАК ЖАГУ — Жалал-Абадский колледж",
              alternateName: "JAC JAGU — Jalal-Abad College",
              url: siteUrl,
              logo: `${siteUrl}/images/college-logo.svg`,
              image: `${siteUrl}/images/college-logo.jpg`,
              description: "Система электронного документооборота Жалал-Абадского колледжа",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Жалал-Абад",
                addressCountry: "KG",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "СЭД ЖАК ЖАГУ",
              operatingSystem: "Web",
              applicationCategory: "BusinessApplication",
              description: "Система электронного документооборота Жалал-Абадского колледжа",
              url: siteUrl,
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "KGS",
              },
            }),
          }}
        />
      </head>
      <body className={`min-h-full ${inter.variable}`}>
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
