"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CreditCard,
  ShieldAlert,
  Search,
  Bell,
  ChevronDown,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Payments", href: "#", icon: CreditCard },
  { name: "Disputes", href: "/disputes", icon: ShieldAlert, badge: "AI Active" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-rp-bg font-sans">
      {/* Left Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-rp-navy text-white border-r border-rp-navy-600 shadow-xl">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-rp-navy-600 bg-[#091438]">
          <div className="flex items-center space-x-3">
            {/* Signature Razorpay Brand Green Gradient Logo Mark */}
            <div className="w-8 h-8 rounded-[4px] rp-gradient-green flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-rp-ink-black" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-medium text-base tracking-tight text-white flex items-center gap-1.5">
                Razorpay
                <span className="text-rp-blue-light font-display font-semibold text-sm tracking-wider uppercase">
                  Aegis
                </span>
              </span>
              <span className="text-[10px] text-rp-muted-2 font-medium">
                Dispute Defense Copilot
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-rp-muted-2 uppercase tracking-wider">
            Merchant Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/disputes"
                ? pathname === "/disputes" || pathname === "/"
                : pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-[4px] text-sm font-medium transition-all ${
                  isActive
                    ? "bg-rp-blue-bg/15 text-white border-l-[3px] border-rp-blue shadow-xs"
                    : "text-slate-300 hover:bg-rp-navy-800 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-rp-blue-light" : "text-rp-muted-2 group-hover:text-slate-200"
                    }`}
                  />
                  <span className={isActive ? "font-semibold text-white" : ""}>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold bg-rp-blue-bg text-rp-blue border border-rp-blue/30 shadow-2xs">
                    <Sparkles className="w-2.5 h-2.5 text-rp-blue" />
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Merchant Footer */}
        <div className="p-4 border-t border-rp-navy-600 bg-[#091438] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200">
                Acme Store India
              </span>
              <span className="text-[11px] text-rp-muted-2 font-mono">
                MID: RZP_TEST_9024
              </span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Test Mode
            </span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 bg-rp-surface border-b border-rp-border flex items-center justify-between px-6 z-10 rp-shadow-soft">
          <div className="flex items-center space-x-4 flex-1 max-w-lg">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-rp-muted-2" />
              <input
                type="text"
                placeholder="Search disputes, ARN, payment IDs..."
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-rp-bg border border-rp-border rounded-[4px] text-rp-ink placeholder:text-rp-muted-2 focus:outline-none focus:ring-1 focus:ring-rp-blue focus:border-rp-blue transition-all"
                readOnly
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-rp-blue-bg/60 border border-rp-blue/20 text-rp-blue text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-rp-blue animate-pulse"></span>
              Aegis Engine Ready
            </div>

            <button
              type="button"
              className="p-2 text-rp-muted hover:text-rp-ink hover:bg-rp-bg-2 rounded-[4px] transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-rp-border" />

            <div className="flex items-center space-x-2 pl-1 cursor-pointer">
              <div className="w-8 h-8 rounded-[4px] bg-rp-navy text-white flex items-center justify-center text-xs font-bold shadow-xs">
                AS
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-rp-ink">
                  Acme Merchant
                </span>
                <span className="text-[10px] text-rp-muted">
                  Admin Access
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-rp-muted-2" />
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-rp-bg text-rp-ink">
          {children}
        </main>

        {/* Shell Prototype Disclaimer Footer */}
        <footer className="h-9 bg-rp-surface border-t border-rp-border px-6 flex items-center justify-between text-xs text-rp-muted flex-shrink-0 rp-shadow-up">
          <span className="font-medium text-rp-slate">
            Hackathon prototype — not an official Razorpay product.
          </span>
          <div className="flex items-center space-x-4 text-[11px] text-rp-muted-2">
            <span>Powered by Razorpay Dispute APIs & AI</span>
            <span>v0.1.0-alpha</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
