// Root layout. Wraps the app with ThemeProvider, SWR global config,
// and an error boundary. Disables user-scalable zoom for mobile.

import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
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
  interactiveWidget: "resizes-content",
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
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head />
      <body
        className={`${geist.variable} font-sans antialiased overflow-x-hidden`}
      >
        <ThemeProvider>
          <SwrProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Toaster position="bottom-right" richColors theme="system" closeButton duration={3000} />
          </SwrProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
