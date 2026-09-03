"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Gavel,
  Receipt,
  Wallet,
  Settings,
  Zap,
  HelpCircle,
  Code,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  Shield,
  LogOut,
  Sliders,
  ExternalLink,
  PlusCircle,
  Unlink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ModeSwitcher } from "./mode-switcher";
import { ConnectRazorpayModal } from "./connect-razorpay-modal";
import { useMerchantMode } from "@/context/merchant-mode-context";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: "Overview", href: "/overview", icon: LayoutDashboard },
  { name: "Disputes", href: "/disputes", icon: Gavel },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Settlements", href: "/settlements", icon: Wallet },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface DashboardShellProps {
  children: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export function DashboardShell({
  children,
  searchQuery = "",
  onSearchChange,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { mode, toggleMode, merchant, setIsConnectModalOpen, disconnectAccount } = useMerchantMode();

  const [notifications, setNotifications] = useState<
    { id: string; title: string; time: string; unread: boolean; href: string }[]
  >([]);

  useEffect(() => {
    fetch(`/api/disputes?mode=${mode}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.ok && Array.isArray(json.data) && json.data.length > 0) {
          const items = json.data.slice(0, 4).map((d: { id: string; reasonCode: string; amount: number; respondBy: string }) => ({
            id: d.id,
            title: `Dispute ${d.id} (Code ${d.reasonCode}) — ₹${((d.amount || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            time: `Respond by ${new Date(d.respondBy).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`,
            unread: true,
            href: "/disputes",
          }));
          setNotifications(items);
        } else {
          setNotifications([]);
        }
      })
      .catch(() => {
        // graceful fallback
      });
  }, [mode]);

  const handleSignOut = () => {
    toast.success("Signed out of Razorpay Aegis Console");
    setTimeout(() => {
      router.push("/overview");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-ink font-sans antialiased flex flex-col" suppressHydrationWarning>
      {/* SideNavBar - Desktop */}
      <nav className="fixed left-0 top-0 h-screen w-[240px] bg-[#0D1A48] flex flex-col overflow-y-auto hidden md:flex border-r border-white/10 z-20">
        {/* Brand Header */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/overview" className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">
                Razorpay
              </span>
            </div>
            <div className="flex items-center gap-1 text-white/80 border-l border-white/20 pl-2">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-[12px] font-bold tracking-wider text-white">
                AEGIS
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-3 space-y-0.5">
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
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors text-xs font-semibold ${
                  isActive
                    ? "text-white border-l-[3px] border-primary bg-primary/20"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-primary" : "text-white/60"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer & Quick Actions */}
        <div className="p-4 mt-auto">
          <div className="border-t border-white/10 pt-3 space-y-1 text-xs">
            <button
              type="button"
              onClick={() => setIsConnectModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-white/70 hover:text-white transition-colors cursor-pointer text-left rounded-[4px] hover:bg-white/5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-primary" />
              <span>Connect Account</span>
            </button>
            <Link
              href="/settings"
              className="flex items-center gap-2.5 px-3 py-2 text-white/60 hover:text-white transition-colors rounded-[4px] hover:bg-white/5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Defense Rules</span>
            </Link>
            <a
              href="https://razorpay.com/docs/payments/disputes/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 text-white/60 hover:text-white transition-colors rounded-[4px] hover:bg-white/5"
            >
              <Code className="w-3.5 h-3.5" />
              <span>API Reference</span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
            </a>
          </div>
        </div>
      </nav>

      {/* SideNavBar - Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <nav className="relative w-[240px] h-full bg-[#0D1A48] flex flex-col p-4 z-50 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white">
                  Razorpay
                </span>
                <div className="flex items-center gap-1 text-white/80 border-l border-white/20 pl-2">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[12px] font-bold tracking-wider">
                    AEGIS
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 space-y-1">
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
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-xs font-semibold ${
                      isActive
                        ? "text-white border-l-[3px] border-primary bg-primary/20"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* TopNavBar */}
      <header className="fixed top-0 right-0 left-0 md:left-[240px] h-14 bg-white border-b border-border-subtle shadow-xs flex justify-between items-center px-5 md:px-8 z-10">
        {/* Live Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-slate" />
            <input
              type="text"
              placeholder="Search dispute ID, payment ID, customer, reason..."
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-[4px] bg-slate-50 border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden transition-all text-xs text-ink placeholder:text-muted-slate"
            />
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden text-ink p-1.5 hover:bg-slate-100 rounded-[4px] cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Right Actions: Mode Switcher + Notifications + User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Razorpay Native Mode Switcher */}
          <ModeSwitcher />

          {/* Notification Bell Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="notification-bell"
                className="hover:bg-slate-100 transition-colors p-1.5 rounded-[4px] relative cursor-pointer outline-hidden"
              >
                <Bell className="w-4 h-4 text-muted-slate hover:text-ink" />
                {notifications.some((n) => n.unread) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-white" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2 space-y-1">
              <DropdownMenuLabel className="flex items-center justify-between text-xs">
                <span>Dispute Alerts ({mode === "live" ? "Live" : "Test"})</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold">
                  {notifications.length} Pending
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    onClick={() => router.push("/disputes")}
                    className="flex flex-col items-start gap-0.5 p-2 cursor-pointer hover:bg-slate-50 rounded-[4px]"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="font-semibold text-xs text-ink truncate">
                        {n.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-slate pl-3.5 font-mono">
                      {n.time}
                    </span>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-slate-500">
                  No pending dispute alerts in {mode.toUpperCase()} mode.
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/disputes")}
                className="text-center justify-center font-semibold text-xs text-primary cursor-pointer"
              >
                View all in Defense Console
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/settings"
            className="hover:bg-slate-100 transition-colors p-1.5 rounded-[4px] hidden md:block"
            title="Settings & Help"
          >
            <HelpCircle className="w-4 h-4 text-muted-slate hover:text-ink" />
          </Link>

          <div className="h-5 w-px bg-border-subtle mx-0.5 hidden md:block" />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="user-profile-menu"
                className="flex items-center gap-2 hover:bg-slate-100 transition-colors p-1 pr-1.5 rounded-[4px] cursor-pointer outline-hidden"
              >
                <div className="w-7 h-7 rounded-[4px] bg-[#0D1A48] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {merchant.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left hidden md:block">
                  <span className="text-xs font-semibold text-ink block leading-tight">
                    {merchant.name}
                  </span>
                  <span className="text-[10px] text-muted-slate block font-mono">
                    {merchant.merchantId}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-slate hidden md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-1.5 space-y-1 text-xs">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-900">{merchant.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{merchant.merchantId}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsConnectModalOpen(true)}
                className="cursor-pointer gap-2 text-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-primary" />
                <span>Connect Razorpay Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={toggleMode}
                className="cursor-pointer gap-2 text-xs"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Switch to {mode === "test" ? "Live Mode" : "Test Mode"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/settings")}
                className="cursor-pointer gap-2 text-xs"
              >
                <Settings className="w-3.5 h-3.5 text-muted-slate" />
                <span>Aegis Rules & Automation</span>
              </DropdownMenuItem>
              {merchant.isConnected && (
                <DropdownMenuItem
                  onClick={async () => {
                    await disconnectAccount();
                    toast.info("Disconnected live Razorpay account");
                  }}
                  className="cursor-pointer gap-2 text-xs text-amber-700"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Disconnect Live Account</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer gap-2 text-xs text-rose-600 focus:text-rose-700 focus:bg-rose-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-14 md:ml-[240px] min-h-[calc(100vh-120px)] p-5 md:p-8 max-w-[1440px] w-full">
        {children}
      </main>

      {/* Connect Razorpay Account Modal */}
      <ConnectRazorpayModal />

      {/* Bottom Footer */}
      <footer className="md:ml-[240px] w-full max-w-[calc(100%-240px)] py-5 px-5 md:px-8 flex flex-col md:flex-row justify-between items-center border-t border-border-subtle mt-auto bg-white gap-3 text-xs">
        <div className="text-muted-slate font-medium">
          © 2026 Razorpay Software Pvt. Ltd. · Aegis Dispute Defense Engine
        </div>
        <div className="flex gap-5 font-semibold text-muted-slate justify-center">
          <Link href="/disputes" className="hover:text-primary transition-colors">
            Dispute Engine
          </Link>
          <Link href="/settings" className="hover:text-primary transition-colors">
            Merchant Rules
          </Link>
          <a
            href="https://razorpay.com/docs/payments/disputes/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Razorpay Docs
          </a>
        </div>
        <div className="text-[11px] text-muted-slate font-mono">
          NPCI UPI 2.0 & Card Rails · Production Ready
        </div>
      </footer>
    </div>
  );
}
