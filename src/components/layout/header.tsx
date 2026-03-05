"use client";
import React from "react";
import { Bell, Menu, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "next-themes";
import { useMeQuery } from "@/hooks/use-auth";
import Link from "next/link";
import { useNotificationsQuery } from "@/services/notifications/notification.hooks";
import { useClickSound } from "@/components/click-sound-provider";

interface HeaderProps {
    onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { resolvedTheme, setTheme } = useTheme();
    const { enabled: soundEnabled, toggle: toggleSound } = useClickSound();
    const { data } = useNotificationsQuery();
    const notifications = Array.isArray(data) ? data : data?.results ?? [];
    const unreadCount =
        typeof data === "object" && data && "unreadCount" in data && typeof data.unreadCount === "number"
            ? data.unreadCount
            : notifications.filter((item) => !item.isRead).length;
    const isDark = resolvedTheme === "dark";
    const meQuery = useMeQuery();
    const name = meQuery.data?.name?.trim() || "Test User";
    const avatarPath = meQuery.data?.profile?.avatar;
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/v1\/?$/, "");
    const avatarUrl = avatarPath
        ? avatarPath.startsWith("http://") || avatarPath.startsWith("https://")
            ? avatarPath
            : apiBase
                ? `${apiBase}/${avatarPath.replace(/^\/+/, "")}`
                : null
        : null;
    const initials = name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "T";

    return (
        <header className="h-14 sm:h-16 bg-white px-2.5 sm:px-4 md:px-6 sticky top-0 z-50 relative overflow-hidden border-b border-slate-900/[0.12] dark:border-white/5 dark:bg-card dark:backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 hidden dark:block h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="absolute inset-0 pointer-events-none hidden dark:block bg-[radial-gradient(circle_at_left,hsl(var(--primary)/0.16),transparent_55%),radial-gradient(circle_at_right,hsl(var(--accent)/0.14),transparent_45%)]" />

            <div className="relative h-full flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={onMenuClick}
                        className="md:hidden text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-background/30 transition-colors"
                    >
                        <Menu size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                    onClick={toggleSound}
                    className="p-1.5 sm:p-2 text-muted-foreground hover:text-primary hover:bg-background/40 rounded-lg transition-all"
                    title={soundEnabled ? "Mute Click Sound" : "Unmute Click Sound"}
                    aria-label={soundEnabled ? "Mute click sound" : "Unmute click sound"}
                    data-click-sound="off"
                >
                    {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>

                <button
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    className="p-1.5 sm:p-2 text-muted-foreground hover:text-primary hover:bg-background/40 rounded-lg transition-all"
                    title="Toggle Theme"
                >
                    <Sun size={16} className="hidden dark:block" />
                    <Moon size={16} className="block dark:hidden" />
                </button>

                <div className="relative">
                    <Link
                        href="/dashboard/notifications"
                        className="relative inline-flex p-1.5 sm:p-2 text-muted-foreground hover:text-primary hover:bg-background/40 rounded-lg transition-all"
                        aria-label="Open notifications"
                    >
                        <Bell size={16} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                        )}
                    </Link>
                </div>

                    <Link
                        href="/dashboard/profile"
                        className="group flex items-center gap-2 rounded-full bg-foreground/[0.03] pl-1.5 sm:pl-2 pr-2 sm:pr-3 py-1 transition-colors hover:bg-foreground/[0.06] dark:bg-background/35 dark:hover:bg-background/50"
                        aria-label="Open profile"
                    >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold text-xs sm:text-sm overflow-hidden">
                            {avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                            ) : (
                                initials
                            )}
                        </div>
                        <div className="hidden sm:block leading-tight max-w-[112px]">
                            <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{name}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Welcome back</p>
                        </div>
                    </Link>
                </div>
            </div>
        </header>
    );
}
