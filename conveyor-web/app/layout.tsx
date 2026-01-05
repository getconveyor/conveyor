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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Conveyor - Data Platform",
  description:
    "Unified data platform for integration, transformation, analytics, and governance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
      </body>
    </html>
  );
}
