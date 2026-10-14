import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppProviders } from "@/components/providers";
import { ThemeScript } from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Perplexity",
  description: "Ask anything. Get a direct answer you can follow up on.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <ThemeScript />
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-canvas font-sans text-primary`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
