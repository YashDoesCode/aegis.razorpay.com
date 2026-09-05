"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  LayoutDashboard,
  ShieldAlert,
  ArrowLeftRight,
  Landmark,
  ShieldCheck,
  Settings,
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
import { ModeSwitcher } from "./mode-switcher";
import { useMerchantMode } from "@/context/merchant-mode-context";
import { safeStorage, STORAGE_KEYS } from "@/lib/storage/safeStorage";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  matchPrefix?: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/overview",
    matchPrefix: "/overview",
    icon: LayoutDashboard,
  },
  {
    name: "Disputes",
    href: "/disputes",
    matchPrefix: "/disputes",
    icon: ShieldAlert,
  },
  {
    name: "Transactions",
    href: "/transactions",
    matchPrefix: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    name: "Settlements",
    href: "/settlements",
    matchPrefix: "/settlements",
    icon: Landmark,
  },
  {
    name: "Fraud Engine",
    href: "/fraud",
    matchPrefix: "/fraud",
    icon: ShieldCheck,
  },
  {
    name: "Settings",
    href: "/settings",
    matchPrefix: "/settings",
    icon: Settings,
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

  const [notifications, setNotifications] = useState<
    { id: string; title: string; time: string; unread: boolean; href: string }[]
  >([]);

  useEffect(() => {
    if (pathname && pathname !== "/") {
      safeStorage.setItem(STORAGE_KEYS.LAST_TAB, pathname);
    }
  }, [pathname]);

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

  const merchantName = merchant?.name || "Acme India Retail Ltd";
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
        className="w-full min-h-screen bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-slate-900 selection:text-white transition-colors duration-200"
        suppressHydrationWarning
      >
        <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col justify-between gap-4 sm:gap-6 relative">
          <header className="flex items-center justify-between gap-2.5 sm:gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 lg:gap-4.5 shrink-0">
              <Link href="/overview" className="flex items-center gap-2.5 group shrink-0">
                <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-[#305EFF] flex items-center justify-center text-white shadow-xs group-hover:bg-[#244BCC] transition-colors duration-200">
                  <svg
                    className="w-4.5 h-4.5 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13.5 2H6.5L3 14H9.8L7 22L17.8 9.5H11.2L13.5 2Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] sm:text-[15px] font-extrabold tracking-tight text-slate-950 dark:text-white leading-none">
                      Razorpay
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-100/60 dark:border-blue-800/60">
                      Aegis
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500 uppercase mt-0.5 sm:mt-1">
                    Dispute Operations
                  </span>
                </div>
              </Link>

              <div className="hidden lg:flex items-center">
                <nav
                  className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200/70 dark:border-slate-700/70 text-xs font-medium text-slate-600 dark:text-slate-300 transition-all duration-200 gap-1"
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

                    const IconComp = item.icon;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "px-3 xl:px-3.5 py-1 sm:py-1.5 rounded-full transition-all duration-150 cursor-pointer text-[11px] sm:text-xs flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100 focus-visible:outline-hidden whitespace-nowrap",
                          isActive
                            ? "bg-slate-950 dark:bg-blue-600 text-white font-semibold shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                        )}
                      >
                        <IconComp className="w-3.5 h-3.5 stroke-[1.75] shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <ModeSwitcher />

              <div className="relative hidden md:block w-36 lg:w-44 xl:w-56 2xl:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={effectiveSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search dispute, RRN..."
                  aria-label="Search dispute, RRN, order ID"
                  className="w-full pl-8 pr-3 py-1 sm:py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-full text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400 focus:bg-white dark:focus:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-400 transition"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Notifications"
                    data-testid="notification-bell"
                    className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white relative transition shadow-xs cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.75]" />
                    {notifications.some((n) => n.unread) && (
                      <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-800" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80 p-2 space-y-1 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <DropdownMenuLabel className="flex items-center justify-between text-xs px-2 py-1">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Dispute Alerts ({mode === "live" ? "Live" : "Test"})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold border border-rose-100 dark:border-rose-800">
                      {notifications.length} Pending
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        onClick={() => router.push("/disputes")}
                        className="flex flex-col items-start gap-0.5 p-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {n.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 pl-3.5 font-mono">
                          {n.time}
                        </span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                      No pending dispute alerts in {mode.toUpperCase()} mode.
                    </div>
                  )}
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                  <DropdownMenuItem
                    onClick={() => router.push("/disputes")}
                    className="text-center justify-center font-semibold text-xs text-primary cursor-pointer rounded-xl py-2 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                  >
                    View all in Defense Console &rarr;
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    id="tour-merchant-menu"
                    data-testid="user-profile-menu"
                    aria-label={`Merchant Account Menu: ${merchant.name || "Acme India Retail Ltd"}`}
                    className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 border border-slate-200/90 dark:border-slate-700 pl-1.5 pr-2.5 sm:pr-3 py-1 rounded-full cursor-pointer transition shadow-xs outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full bg-slate-950 dark:bg-blue-600 text-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold tracking-tight">
                      {merchantInitials}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[85px] sm:max-w-[110px] truncate">
                        {merchant.name || "Acme India Retail Ltd"}
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
                  className="w-64 p-2 space-y-1 text-xs rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <DropdownMenuLabel className="px-2 py-1">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {merchant.name || "Acme India Retail Ltd"}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {merchant.merchantId || "acc_demo_test_01"}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                  <DropdownMenuItem
                    onClick={() => setIsConnectModalOpen(true)}
                    className="cursor-pointer gap-2 text-xs rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-primary" />
                    <span>Connect Razorpay Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={toggleMode}
                    className="cursor-pointer gap-2 text-xs rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      Switch to {mode === "test" ? "Live Mode" : "Test Sandbox"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                    className="cursor-pointer gap-2 text-xs rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Aegis Rules &amp; Themes</span>
                  </DropdownMenuItem>
                  {merchant.isConnected && (
                    <DropdownMenuItem
                      onClick={async () => {
                        await disconnectAccount();
                        toast.info("Disconnected live Razorpay account");
                      }}
                      className="cursor-pointer gap-2 text-xs text-amber-700 dark:text-amber-400 rounded-xl p-2 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Disconnect Live Account</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer gap-2 text-xs text-rose-600 dark:text-rose-400 focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-950/50 rounded-xl p-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 transition shadow-xs cursor-pointer"
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
              <nav className="relative w-[280px] h-full bg-white dark:bg-slate-900 flex flex-col p-5 z-50 text-slate-900 dark:text-white shadow-2xl overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-950 dark:text-white">
                      Razorpay
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-100/60 dark:border-blue-800/60">
                      Aegis
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
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
                    const IconComp = item.icon;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors",
                          isActive
                            ? "bg-slate-950 dark:bg-blue-600 text-white shadow-xs"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
                        )}
                      >
                        <IconComp className="w-4 h-4 stroke-[1.75]" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3 text-xs">
                  <div className="px-1">
                    <ModeSwitcher />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsConnectModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                  >
                    <PlusCircle className="w-4 h-4 text-primary" />
                    <span>Connect Razorpay Account</span>
                  </button>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                  >
                    <Sliders className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>Defense Rules &amp; Themes</span>
                  </Link>
                </div>
              </nav>
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{
                duration: 0.28,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-col gap-4 sm:gap-6 flex-1 w-full"
            >
              {children}
            </motion.main>
          </AnimatePresence>

          <ConnectRazorpayModal />
        </div>
      </div>
    </TooltipProvider>
  );
}
