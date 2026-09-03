import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { MerchantModeProvider } from "@/context/merchant-mode-context";
import { StartupProvider, StartupExperience } from "@/components/startup";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Razorpay Aegis | Autonomous Dispute Defense",
  description: "AI-powered dispute winnability scoring, evidence orchestration, and automated rebuttal drafting on Razorpay.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className="h-full bg-rp-bg text-rp-ink font-sans antialiased"
        suppressHydrationWarning
      >
        <StartupProvider>
          <MerchantModeProvider>
            <TooltipProvider delay={200}>
              <StartupExperience />
              {children}
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </MerchantModeProvider>
        </StartupProvider>
      </body>
    </html>
  );
}
