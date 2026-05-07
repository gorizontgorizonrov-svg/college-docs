import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { OfflineNotice } from "@/components/OfflineNotice";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "ЖАК ЖАГУ - Приемная комиссия",
  description: "Автоматизация документооборота Жалал-Абадского колледжа",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <SessionProvider>
          <OfflineNotice />
          <Navigation />
          <main className="flex-1 pb-20 md:pb-8">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}