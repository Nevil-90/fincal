// Root layout. Wraps the app with ThemeProvider, SWR global config,
// and an error boundary. Disables user-scalable zoom for mobile.

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finacal",
  description: "Personal finance tracker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SwrProvider } from "@/components/providers/SwrProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <ThemeProvider>
          <SwrProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Toaster position="bottom-right" richColors theme="system" />
          </SwrProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
