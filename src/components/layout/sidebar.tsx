"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    House,
    UserRound,
    BellRing,
    LifeBuoy,
    CreditCard,
    Radio,
    CalendarDays,
    FileText,
    ChevronLeft,
    ChevronRight,
    LogOut,
    type LucideIcon,
} from "lucide-react";
import React from "react";
import { BrandLogo } from "./brand-logo";
import { useLogoutMutation } from "@/hooks/use-auth";

type SidebarNavItem = {
    name: string;
    path: string;
    icon: LucideIcon;
};

const navigation: SidebarNavItem[] = [
    { name: "Dashboard", path: "/dashboard", icon: House },
    { name: "Profile", path: "/dashboard/profile", icon: UserRound },
    { name: "Connect Alerts", path: "/dashboard/alerts", icon: BellRing },
    { name: "Signal", path: "/dashboard/signals", icon: Radio },
    { name: "Plans & Billing", path: "/dashboard/plans", icon: CreditCard },
    { name: "Calendar", path: "/dashboard/economic-calendar", icon: CalendarDays },
    { name: "Support", path: "/dashboard/support", icon: LifeBuoy },
    { name: "Privacy Policy", path: "/dashboard/privacy-policy", icon: FileText },
];

const SidebarItem = ({
    item,
    collapsed,
    onNavigate,
}: {
    item: SidebarNavItem;
    collapsed: boolean;
    onNavigate?: () => void;
}) => {
    const pathname = usePathname();
    const isActive =
        item.path === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.path || pathname.startsWith(`${item.path}/`);
    const Icon = item.icon;

    return (
        <Link
            href={item.path}
            title={collapsed ? item.name : undefined}
            onClick={() => {
                onNavigate?.();
            }}
            className={cn(
                "group relative flex items-center rounded-xl transition-all duration-300",
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                isActive
                    ? "bg-sky-500/12 text-sky-700 dark:bg-sky-400/14 dark:text-sky-200 dark:shadow-[0_0_0_1px_rgba(56,189,248,0.35),0_12px_24px_-16px_rgba(56,189,248,0.65)]"
                    : "text-slate-600 hover:bg-slate-900/[0.05] hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
            )}
        >
            <Icon
                size={18}
                className={cn(
                    "shrink-0 transition-transform duration-300",
                    isActive ? "dark:drop-shadow-[0_0_10px_rgba(56,189,248,0.75)]" : "group-hover:scale-105"
                )}
            />

            {!collapsed && (
                <span className="ml-3 text-xs sm:text-sm font-semibold tracking-tight">
                    {item.name}
                </span>
            )}
        </Link>
    );
};

export function Sidebar({
    className,
    collapsed,
    setCollapsed,
    showCollapseToggle = true,
    onNavigate,
}: {
    className?: string;
    collapsed: boolean;
    setCollapsed: (val: boolean) => void;
    showCollapseToggle?: boolean;
    onNavigate?: () => void;
}) {
    const router = useRouter();
    const logoutMutation = useLogoutMutation();

    const handleLogout = async () => {
        const action = async () => {
            try {
                await logoutMutation.mutateAsync();
            } finally {
                router.replace("/login");
            }
        };

        const requestLeave =
            typeof window !== "undefined"
                ? (window as { __requestDashboardLeave?: (request: { href?: string; action?: () => Promise<void> | void }) => void })
                    .__requestDashboardLeave
                : undefined;

        if (requestLeave) {
            requestLeave({ href: "/login", action });
            return;
        }

        await action();
    };

    return (
        <aside
            className={cn(
                "relative h-full border-r border-slate-300/80 bg-[linear-gradient(180deg,rgba(248,252,255,0.98),rgba(239,247,255,0.92))] text-foreground transition-all duration-300 ease-custom-bezier dark:border-slate-700/55 dark:bg-[linear-gradient(180deg,rgba(4,12,33,0.96),rgba(7,18,45,0.94))] dark:backdrop-blur-xl",
                collapsed ? "w-[4.25rem]" : "w-[16.25rem] sm:w-72",
                className
            )}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.16),transparent_42%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.1),transparent_44%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.24),transparent_40%),radial-gradient(circle_at_100%_100%,rgba(245,158,11,0.16),transparent_44%)]" />
            <div className="pointer-events-none absolute inset-0 bg-cyber-grid opacity-[0.06] dark:opacity-25" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/70 to-transparent dark:via-sky-300/70" />

            <div className="relative z-10 flex h-full flex-col">
                <div className={cn("flex h-14 sm:h-16 items-center", collapsed ? "justify-center px-1.5" : "justify-between px-3 sm:px-4")}>
                    {!collapsed && (
                        <BrandLogo
                            className="gap-2"
                            imageClassName="h-8 w-8 sm:h-9 sm:w-9 rounded-lg"
                            showText
                            titleClassName="text-sm sm:text-base"
                            subtitleClassName="text-[10px] sm:text-xs"
                        />
                    )}

                    {showCollapseToggle && (
                        <button
                            type="button"
                            onClick={() => setCollapsed(!collapsed)}
                            className={cn(
                                "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-slate-100/80 text-slate-600 transition-all duration-300 hover:bg-sky-500/14 hover:text-sky-700 dark:bg-slate-900/45 dark:text-slate-300 dark:hover:bg-sky-400/10 dark:hover:text-sky-200 dark:hover:shadow-[0_10px_24px_-14px_rgba(56,189,248,0.7)]",
                                collapsed ? "mx-auto" : ""
                            )}
                            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        </button>
                    )}
                </div>

                {!collapsed && (
                    <div className="px-3 sm:px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Navigation
                    </div>
                )}

                <nav className={cn("flex-1 space-y-1.5 overflow-y-auto", collapsed ? "px-1.5 py-3" : "px-2.5 sm:px-3 py-2.5")}>
                    {navigation.map((item) => (
                        <SidebarItem key={item.name} item={item} collapsed={collapsed} onNavigate={onNavigate} />
                    ))}
                </nav>

                <div className={cn(collapsed ? "p-1.5" : "p-2.5 sm:p-3")}>
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "w-full rounded-xl border border-rose-500/35 bg-rose-500/10 text-rose-700 transition-all duration-300 hover:bg-rose-500/18 dark:text-rose-300 dark:hover:shadow-[0_10px_30px_-18px_rgba(244,63,94,0.75)]",
                            collapsed ? "flex h-10 items-center justify-center" : "flex h-10 items-center justify-center gap-2 text-xs sm:text-sm font-semibold"
                        )}
                        title="Logout"
                        disabled={logoutMutation.isPending}
                    >
                        <LogOut size={18} />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </div>

        </aside>
    );
}
