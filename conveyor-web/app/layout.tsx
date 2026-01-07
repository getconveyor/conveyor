"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { QueryProvider } from "@/components/providers/query-provider";
import { AccessibilityProvider } from "@/components/accessibility-provider";
import { SkipToMain } from "@/components/skip-to-main";
import { ThemeProvider } from "@/components/theme-provider";
import { NoInternet } from "@/components/ui/no-internet";
import { BackendUnavailable } from "@/components/ui/backend-unavailable";
import { NetworkProvider, useNetwork } from "@/contexts/network-context";
import { BackendProvider, useBackend } from "@/contexts/backend-context";
import React from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NetworkProvider>
            <BackendProvider>
              <AppGate>{children}</AppGate>
            </BackendProvider>
          </NetworkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

function AppGate({ children }: { children: React.ReactNode }) {
  const { online } = useNetwork();
  const { healthy } = useBackend();
  if (!online) {
    return <NoInternet />;
  }
  if (!healthy) {
    return <BackendUnavailable />;
  }
  return (
    <AccessibilityProvider>
      <SkipToMain />
      <ErrorBoundary>
        <QueryProvider>
          <AuthProvider>
            <WorkspaceProvider>
              {children}
              <Toaster richColors position="top-right" />
            </WorkspaceProvider>
          </AuthProvider>
        </QueryProvider>
      </ErrorBoundary>
    </AccessibilityProvider>
  );
}
