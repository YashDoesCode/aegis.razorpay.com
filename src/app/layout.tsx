import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { MerchantModeProvider } from "@/context/merchant-mode-context";
import { ThemeProvider } from "@/context/theme-context";
import { StartupProvider, StartupExperience } from "@/components/startup";
import { OnboardingProvider, OnboardingManager } from "@/components/onboarding";
import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Razorpay Aegis | Autonomous Dispute Defense",
  description: "AI-powered dispute winnability scoring, evidence orchestration, and automated rebuttal drafting on Razorpay.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Razorpay Aegis",
  },
  icons: {
    icon: [
      { url: "/Favicon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/Favicon.png",
    apple: "/Favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full dark`}
      suppressHydrationWarning
    >
      <body
        className="h-full bg-background text-foreground font-sans antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <StartupProvider>
            <OnboardingProvider>
              <MerchantModeProvider>
                <TooltipProvider delay={200}>
                  <StartupExperience />
                  <OnboardingManager />
                  <PwaInstallPrompt />
                  {children}
                  <Toaster richColors position="top-right" />
                </TooltipProvider>
              </MerchantModeProvider>
            </OnboardingProvider>
          </StartupProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
