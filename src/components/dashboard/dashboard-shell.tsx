"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  Zap,
  Sliders,
  PlusCircle,
  Unlink,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ConnectRazorpayModal } from "./connect-razorpay-modal";
import { useMerchantMode } from "@/context/merchant-mode-context";
import { useStartupContext } from "@/components/startup/startup-context";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  matchPrefix?: string;
  hiddenClass?: string;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/overview", matchPrefix: "/overview" },
  { name: "Disputes", href: "/disputes", matchPrefix: "/disputes" },
  { name: "Transactions", href: "/transactions", matchPrefix: "/transactions" },
  { name: "Settlements", href: "/settlements", matchPrefix: "/settlements" },
  {
    name: "Fraud Engine",
    href: "/disputes?filter=high_risk",
    matchPrefix: "/disputes?filter=high_risk",
    hiddenClass: "hidden sm:inline-block",
  },
  {
    name: "Settings",
    href: "/settings",
    matchPrefix: "/settings",
    hiddenClass: "hidden md:inline-block",
  },
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
  const [internalSearch, setInternalSearch] = useState("");

  const effectiveSearch = onSearchChange ? searchQuery : internalSearch;

  const {
    mode,
    toggleMode,
    merchant,
    setIsConnectModalOpen,
    disconnectAccount,
  } = useMerchantMode();

  const { hasCompleted, startupState } = useStartupContext();
  const isIntroActive = !hasCompleted && startupState !== "COMPLETE";

  const [notifications, setNotifications] = useState<
    { id: string; title: string; time: string; unread: boolean; href: string }[]
  >([]);

  useEffect(() => {
    fetch(`/api/disputes?mode=${mode}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.ok && Array.isArray(json.data) && json.data.length > 0) {
          const items = json.data.slice(0, 4).map((d: {
            id: string;
            reasonCode: string;
            amount: number;
            respondBy: string;
          }) => ({
            id: d.id,
            title: `Dispute ${d.id} (Code ${d.reasonCode}) — ₹${(
              (d.amount || 0) / 100
            ).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            time: `Respond by ${new Date(d.respondBy).toLocaleDateString(
              "en-IN",
              { month: "short", day: "numeric" }
            )}`,
            unread: true,
            href: "/disputes",
          }));
          setNotifications(items);
        } else {
          setNotifications([]);
        }
      })
      .catch(() => {});
  }, [mode]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (onSearchChange) {
        onSearchChange(effectiveSearch);
      } else {
        router.push(`/disputes?search=${encodeURIComponent(effectiveSearch)}`);
      }
    }
  };

  const handleSearchChange = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearch(val);
    }
  };

  const handleSignOut = () => {
    toast.success("Signed out of Razorpay Aegis Console");
    setTimeout(() => {
      router.push("/overview");
    }, 500);
  };

  const merchantName = merchant?.name || "Merchant Corp";
  const merchantInitials = React.useMemo(() => {
    const parts = merchantName.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return merchantName.slice(0, 2).toUpperCase();
  }, [merchantName]);

  return (
    <TooltipProvider delay={100}>
      <div
        className="bg-[#ECEEF2] text-slate-900 min-h-screen p-3 md:p-6 lg:p-8 flex items-center justify-center font-sans antialiased selection:bg-slate-900 selection:text-white"
        suppressHydrationWarning
      >
        <motion.div
          initial={{ opacity: 0, filter: "blur(20px)", scale: 0.985 }}
          animate={
            isIntroActive
              ? { opacity: 0, filter: "blur(20px)", scale: 0.985 }
              : { opacity: 1, filter: "blur(0px)", scale: 1 }
          }
          transition={{
            duration: 0.85,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="w-full max-w-[1440px] bg-white rounded-[24px] md:rounded-[28px] p-4 sm:p-6 lg:p-7 shadow-xl shadow-slate-300/40 border border-slate-200/90 flex flex-col justify-between gap-5 relative overflow-hidden will-change-[opacity,filter,transform]"
        >
          <header className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-4 sm:gap-5 flex-wrap">
              <Link href="/overview" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center text-white shadow-xs group-hover:bg-primary transition-colors duration-200">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.75"
                    viewBox="0 0 24 24"
                  >
                    <polygon
                      fill="currentColor"
                      fillOpacity="0.15"
                      points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
                    />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-extrabold tracking-tight text-slate-950 leading-none">
                      Razorpay
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/60">
                      Aegis
                    </span>
                  </div>
                  <span className="text-[10px] font-medium tracking-wide text-slate-400 uppercase mt-1">
                    Dispute Operations
                  </span>
                </div>
              </Link>

              <nav
                className="hidden lg:flex items-center bg-slate-100/80 p-1 rounded-full border border-slate-200/70 text-xs font-medium text-slate-600"
                aria-label="Main Navigation"
              >
                {navItems.map((item) => {
                  const isActive =
                    item.href === "/overview"
                      ? pathname === "/overview" || pathname === "/"
                      : pathname === item.href ||
                        (item.matchPrefix &&
                          pathname.startsWith(item.matchPrefix) &&
                          item.matchPrefix !== "/overview");

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "px-4 py-1.5 rounded-full transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden",
                        item.hiddenClass,
                        isActive
                          ? "bg-slate-950 text-white font-semibold shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                      )}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="relative hidden sm:block w-48 md:w-56 lg:w-68">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={effectiveSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search dispute, RRN, order ID..."
                  aria-label="Search dispute, RRN, order ID"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-full text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400 focus:bg-white focus-visible:ring-2 focus-visible:ring-slate-400 transition"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Notifications"
                    data-testid="notification-bell"
                    className="w-8 h-8 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 flex items-center justify-center text-slate-600 hover:text-slate-950 relative transition shadow-xs cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <Bell className="w-4 h-4 stroke-[1.75]" />
                    {notifications.some((n) => n.unread) && (
                      <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80 p-2 space-y-1 rounded-2xl shadow-xl border border-slate-200 bg-white"
                >
                  <DropdownMenuLabel className="flex items-center justify-between text-xs px-2 py-1">
                    <span className="font-bold text-slate-900">
                      Dispute Alerts ({mode === "live" ? "Live" : "Test"})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-100">
                      {notifications.length} Pending
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        onClick={() => router.push("/disputes")}
                        className="flex flex-col items-start gap-0.5 p-2.5 cursor-pointer hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span className="font-semibold text-xs text-slate-900 truncate">
                            {n.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 pl-3.5 font-mono">
                          {n.time}
                        </span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-500">
                      No pending dispute alerts in {mode.toUpperCase()} mode.
                    </div>
                  )}
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem
                    onClick={() => router.push("/disputes")}
                    className="text-center justify-center font-semibold text-xs text-primary cursor-pointer rounded-xl py-2 hover:bg-blue-50"
                  >
                    View all in Defense Console &rarr;
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-testid="user-profile-menu"
                    aria-label={`Merchant Account Menu: ${merchant.name || "Merchant Corp"}`}
                    className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 pl-1.5 pr-3 py-1 rounded-full cursor-pointer transition shadow-xs outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold tracking-tight">
                      {merchantInitials}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-800 max-w-[110px] truncate">
                        {merchant.name || "Merchant Corp"}
                      </span>
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          mode === "live" && merchant.isConnected
                            ? "bg-emerald-500"
                            : mode === "live"
                            ? "bg-blue-500"
                            : "bg-amber-500"
                        )}
                        title={
                          mode === "live"
                            ? merchant.isConnected
                              ? "Live Connected"
                              : "Live Mode"
                            : "Test Sandbox Mode"
                        }
                      />
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400 stroke-[2]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 p-2 space-y-1 text-xs rounded-2xl shadow-xl border border-slate-200 bg-white"
                >
                  <DropdownMenuLabel className="px-2 py-1">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-900">
                        {merchant.name || "Merchant Corp"}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {merchant.merchantId || "acc_live_demo"}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem
                    onClick={() => setIsConnectModalOpen(true)}
                    className="cursor-pointer gap-2 text-xs rounded-xl p-2 hover:bg-slate-50"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-primary" />
                    <span>Connect Razorpay Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={toggleMode}
                    className="cursor-pointer gap-2 text-xs rounded-xl p-2 hover:bg-slate-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      Switch to {mode === "test" ? "Live Mode" : "Test Sandbox"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                    className="cursor-pointer gap-2 text-xs rounded-xl p-2 hover:bg-slate-50"
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    <span>Aegis Rules & Automation</span>
                  </DropdownMenuItem>
                  {merchant.isConnected && (
                    <DropdownMenuItem
                      onClick={async () => {
                        await disconnectAccount();
                        toast.info("Disconnected live Razorpay account");
                      }}
                      className="cursor-pointer gap-2 text-xs text-amber-700 rounded-xl p-2 hover:bg-amber-50"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Disconnect Live Account</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer gap-2 text-xs text-rose-600 focus:text-rose-700 focus:bg-rose-50 rounded-xl p-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden w-8 h-8 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 flex items-center justify-center text-slate-700 transition shadow-xs cursor-pointer"
                aria-label="Open Mobile Menu"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </header>

          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
                onClick={() => setMobileMenuOpen(false)}
              />
              <nav className="relative w-[280px] h-full bg-white flex flex-col p-5 z-50 text-slate-900 shadow-2xl overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-950">
                      Razorpay
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/60">
                      Aegis
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-slate-500 hover:text-slate-950 cursor-pointer rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-4 space-y-1.5">
                  {navItems.map((item) => {
                    const isActive =
                      item.href === "/overview"
                        ? pathname === "/overview" || pathname === "/"
                        : pathname === item.href ||
                          (item.matchPrefix &&
                            pathname.startsWith(item.matchPrefix) &&
                            item.matchPrefix !== "/overview");

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors",
                          isActive
                            ? "bg-slate-950 text-white shadow-xs"
                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                        )}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-auto border-t border-slate-100 pt-4 space-y-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsConnectModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:text-slate-950 transition-colors cursor-pointer text-left rounded-xl hover:bg-slate-100 font-medium"
                  >
                    <PlusCircle className="w-4 h-4 text-primary" />
                    <span>Connect Razorpay Account</span>
                  </button>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:text-slate-950 transition-colors rounded-xl hover:bg-slate-100 font-medium"
                  >
                    <Sliders className="w-4 h-4 text-slate-500" />
                    <span>Defense Rules</span>
                  </Link>
                </div>
              </nav>
            </div>
          )}

          <main className="flex flex-col gap-5 flex-1">{children}</main>

          <ConnectRazorpayModal />
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
