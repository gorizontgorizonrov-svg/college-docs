import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { OfflineNotice } from "@/components/OfflineNotice";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LayoutShell } from "@/components/LayoutShell";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "СЭД ЖАК ЖАГУ — Электронный документооборот",
  description: "Автоматизация документооборота Жалал-Абадского колледжа",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased" suppressHydrationWarning>
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
            <OfflineNotice />
            <LayoutShell>{children}</LayoutShell>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
