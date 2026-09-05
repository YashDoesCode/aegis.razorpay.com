"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
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
  PanelRight,
  Download,
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
import { RightSidebar } from "./right-sidebar";
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
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return !safeStorage.getItem<boolean>(STORAGE_KEYS.RIGHT_SIDEBAR_COLLAPSED, false);
  });
  const [canInstall, setCanInstall] = useState(false);

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
    if (typeof window !== "undefined") {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      if (!standalone) {
        setCanInstall(true);
      }
    }
  }, []);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      safeStorage.setItem(STORAGE_KEYS.RIGHT_SIDEBAR_COLLAPSED, !next);
      return next;
    });
  };

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

  const handleTriggerInstall = () => {
    toast.info(
      "To install Aegis: click the Install icon in your browser address bar or select Install Razorpay Aegis from your Chromium browser menu."
    );
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
        className="w-full min-h-screen bg-background text-foreground font-sans antialiased transition-colors duration-200"
        suppressHydrationWarning
      >
        <div className="w-full min-h-screen p-3.5 sm:p-5 lg:p-6 flex flex-col justify-between gap-4 relative">
          <header className="flex items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-border">
            <div className="flex items-center gap-3 lg:gap-5 shrink-0">
              <Link href="/overview" className="flex items-center gap-2.5 group shrink-0">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-xs shrink-0 border border-border/80 bg-card">
                  <Image
                    src="/Favicon.png"
                    alt="Razorpay Aegis Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-semibold tracking-tight text-foreground leading-none">
                      Razorpay
                    </span>
                    <span className="text-[10px] font-medium tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                      Aegis
                    </span>
                  </div>
                  <span className="text-[10px] font-normal tracking-wide text-muted-foreground mt-0.5">
                    Dispute Operations
                  </span>
                </div>
              </Link>

              <div className="hidden lg:flex items-center">
                <nav
                  className="flex items-center bg-muted/50 p-1 rounded-lg border border-border text-xs font-normal text-muted-foreground transition-all duration-200 gap-1"
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
                          "px-3 py-1 rounded-md transition-all duration-150 cursor-pointer text-xs flex items-center gap-1.5 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden whitespace-nowrap",
                          isActive
                            ? "bg-card text-foreground font-medium shadow-xs border border-border"
                            : "hover:text-foreground hover:bg-card/50"
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

              <div className="relative hidden md:block w-36 lg:w-44 xl:w-52">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-muted-foreground">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={effectiveSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search dispute, RRN..."
                  aria-label="Search dispute, RRN, order ID"
                  className="w-full pl-8 pr-3 py-1 text-xs bg-muted/40 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-foreground focus:bg-card transition"
                />
              </div>

              {canInstall && (
                <button
                  type="button"
                  onClick={handleTriggerInstall}
                  aria-label="Install as App"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-foreground bg-card hover:bg-muted border border-border rounded-lg shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-primary" />
                  <span className="hidden md:inline">Install App</span>
                </button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Notifications"
                    data-testid="notification-bell"
                    className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg bg-card hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground relative transition shadow-xs cursor-pointer outline-hidden focus-visible:ring-1 focus-visible:ring-foreground"
                  >
                    <Bell className="w-3.5 h-3.5 stroke-[1.75]" />
                    {notifications.some((n) => n.unread) && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80 p-2 space-y-1 rounded-xl shadow-lg border border-border bg-card"
                >
                  <DropdownMenuLabel className="flex items-center justify-between text-xs px-2 py-1">
                    <span className="font-semibold text-foreground">
                      Dispute Alerts ({mode === "live" ? "Live" : "Test"})
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground font-medium border border-border">
                      {notifications.length} Pending
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        onClick={() => router.push("/disputes")}
                        className="flex flex-col items-start gap-0.5 p-2 cursor-pointer hover:bg-muted rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span className="font-medium text-xs text-foreground truncate">
                            {n.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground pl-3.5 font-mono">
                          {n.time}
                        </span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      No pending dispute alerts in {mode.toUpperCase()} mode.
                    </div>
                  )}
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={() => router.push("/disputes")}
                    className="text-center justify-center font-medium text-xs text-foreground cursor-pointer rounded-lg py-1.5 hover:bg-muted"
                  >
                    View all in Defense Console &rarr;
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={handleToggleSidebar}
                aria-label={sidebarOpen ? "Hide info panel" : "Show info panel"}
                className={cn(
                  "hidden lg:flex w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg border border-border items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer shadow-xs",
                  sidebarOpen ? "bg-muted text-foreground" : "bg-card"
                )}
              >
                <PanelRight className="w-3.5 h-3.5 stroke-[1.75]" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    id="tour-merchant-menu"
                    data-testid="user-profile-menu"
                    aria-label={`Merchant Account Menu: ${merchant.name || "Acme India Retail Ltd"}`}
                    className="flex items-center gap-1.5 sm:gap-2 bg-card hover:bg-muted border border-border pl-1.5 pr-2.5 py-1 rounded-lg cursor-pointer transition shadow-xs outline-hidden focus-visible:ring-1 focus-visible:ring-foreground"
                  >
                    <div className="w-5.5 h-5.5 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-medium tracking-tight">
                      {merchantInitials}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-foreground max-w-[85px] sm:max-w-[110px] truncate">
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
                      />
                    </div>
                    <ChevronDown className="w-3 h-3 text-muted-foreground stroke-[2]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-60 p-1.5 space-y-1 text-xs rounded-xl shadow-lg border border-border bg-card"
                >
                  <DropdownMenuLabel className="px-2 py-1">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground">
                        {merchant.name || "Acme India Retail Ltd"}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {merchant.merchantId || "acc_demo_test_01"}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={() => setIsConnectModalOpen(true)}
                    className="cursor-pointer gap-2 text-xs rounded-lg p-2 hover:bg-muted"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-foreground" />
                    <span>Connect Razorpay Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={toggleMode}
                    className="cursor-pointer gap-2 text-xs rounded-lg p-2 hover:bg-muted"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      Switch to {mode === "test" ? "Live Mode" : "Test Sandbox"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                    className="cursor-pointer gap-2 text-xs rounded-lg p-2 hover:bg-muted"
                  >
                    <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Aegis Rules &amp; Themes</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleTriggerInstall}
                    className="cursor-pointer gap-2 text-xs rounded-lg p-2 hover:bg-muted"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>Install as App (Chromium)</span>
                  </DropdownMenuItem>
                  {merchant.isConnected && (
                    <DropdownMenuItem
                      onClick={async () => {
                        await disconnectAccount();
                        toast.info("Disconnected live Razorpay account");
                      }}
                      className="cursor-pointer gap-2 text-xs text-amber-700 dark:text-amber-400 rounded-lg p-2 hover:bg-muted"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Disconnect Live Account</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer gap-2 text-xs text-rose-600 dark:text-rose-400 focus:bg-muted rounded-lg p-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg bg-card hover:bg-muted border border-border flex items-center justify-center text-foreground transition shadow-xs cursor-pointer"
                aria-label="Open Mobile Menu"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </header>

          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <div
                className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
                onClick={() => setMobileMenuOpen(false)}
              />
              <nav className="relative w-[280px] h-full bg-card flex flex-col p-5 z-50 text-foreground shadow-xl border-r border-border overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center shadow-xs shrink-0 border border-border bg-card">
                      <Image
                        src="/Favicon.png"
                        alt="Razorpay Aegis Logo"
                        width={24}
                        height={24}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="font-semibold text-sm text-foreground">
                      Razorpay Aegis
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="py-4 space-y-1">
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
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                          isActive
                            ? "bg-muted text-foreground border border-border"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <IconComp className="w-4 h-4 stroke-[1.75]" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-auto border-t border-border pt-4 space-y-2 text-xs">
                  <div className="px-1">
                    <ModeSwitcher />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsConnectModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left rounded-lg hover:bg-muted"
                  >
                    <PlusCircle className="w-4 h-4 text-foreground" />
                    <span>Connect Razorpay Account</span>
                  </button>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                  >
                    <Sliders className="w-4 h-4 text-muted-foreground" />
                    <span>Defense Rules &amp; Themes</span>
                  </Link>
                </div>
              </nav>
            </div>
          )}

          <div className="flex gap-4 sm:gap-5 flex-1 items-start w-full">
            <AnimatePresence mode="wait" initial={false}>
              <motion.main
                key={pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{
                  duration: 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex flex-col gap-4 sm:gap-5 flex-1 w-full min-w-0"
              >
                {children}
              </motion.main>
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 24, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: "auto" }}
                  exit={{ opacity: 0, x: 24, width: 0 }}
                  transition={{
                    duration: 0.22,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="hidden lg:block shrink-0 sticky top-4 self-start overflow-hidden"
                >
                  <RightSidebar
                    isOpen={sidebarOpen}
                    onToggle={handleToggleSidebar}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ConnectRazorpayModal />
        </div>
      </div>
    </TooltipProvider>
  );
}
