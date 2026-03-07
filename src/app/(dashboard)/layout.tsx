"use client";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AuthSessionGuard } from "@/components/auth/auth-session-guard";
import { useMeQuery } from "@/hooks/use-auth";
import { useSubscriptionStatusQuery } from "@/services/subscriptions/subscription.hooks";

type LeaveRequest = {
    href?: string;
    action?: () => Promise<void> | void;
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
    const [pendingHref, setPendingHref] = useState<string | null>(null);
    const pendingActionRef = useRef<LeaveRequest["action"]>(null);
    const ignoreNextPopRef = useRef(false);
    const meQuery = useMeQuery();
    const subscriptionStatusQuery = useSubscriptionStatusQuery();

    const planExpiry = meQuery.data?.planExpiry ?? undefined;
    const planName = (meQuery.data?.planName || "").toLowerCase();
    const planId = meQuery.data?.planId ?? null;
    const subscriptionPlan = (meQuery.data?.subscription?.plan || "").toLowerCase();
    const planIsExpired = useMemo(() => {
        if (!planExpiry) return false;
        const expiryDate = new Date(planExpiry);
        if (Number.isNaN(expiryDate.getTime())) return false;
        return expiryDate.getTime() <= Date.now();
    }, [planExpiry]);
    const subscriptionStatus = subscriptionStatusQuery.data?.subscription?.status;
    const normalizedSubscriptionStatus =
        typeof subscriptionStatus === "string" ? subscriptionStatus.toLowerCase() : "";
    const isActiveFromSubscription =
        subscriptionStatusQuery.data?.hasActiveSubscription === true ||
        normalizedSubscriptionStatus === "active";
    const isActiveFromMeData =
        Boolean(meQuery.data?.planId) ||
        (Array.isArray(meQuery.data?.permissions) && meQuery.data.permissions.length > 0);
    const isMarkedExpired = planName.includes("expired");
    const isFreePlan = subscriptionPlan === "free";
    const isPlanMissing = !planId && !isActiveFromMeData;
    const hasActiveAccess = isActiveFromSubscription || isActiveFromMeData || (Boolean(planExpiry) && !planIsExpired);
    const isPlanBlocked =
        !hasActiveAccess &&
        (planIsExpired || isMarkedExpired || isPlanMissing || (isFreePlan && !planId));
    const isAllowedWhenBlocked = pathname === "/dashboard" || pathname.startsWith("/dashboard/plans");
    const shouldRedirectToDashboard = isPlanBlocked && !isAllowedWhenBlocked;

    useEffect(() => {
        if (!shouldRedirectToDashboard) return;
        router.replace("/dashboard");
    }, [shouldRedirectToDashboard, router]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        (window as { __requestDashboardLeave?: (request: LeaveRequest) => void }).__requestDashboardLeave = (request) => {
            setPendingHref(request.href ?? null);
            pendingActionRef.current = request.action ?? null;
            setIsLeaveDialogOpen(true);
        };

        return () => {
            delete (window as { __requestDashboardLeave?: (request: LeaveRequest) => void }).__requestDashboardLeave;
        };
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handlePopState = () => {
            if (ignoreNextPopRef.current) {
                ignoreNextPopRef.current = false;
                return;
            }

            const nextPath = window.location.pathname;
            if (nextPath.startsWith("/dashboard")) {
                return;
            }

            window.history.pushState({ dashboardGuard: true }, "", window.location.href);
            setPendingHref(null);
            pendingActionRef.current = async () => {
                ignoreNextPopRef.current = true;
                window.history.back();
            };
            setIsLeaveDialogOpen(true);
        };

        window.history.pushState({ dashboardGuard: true }, "", window.location.href);
        window.addEventListener("popstate", handlePopState);
        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, []);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const target = event.target as Element | null;
            const anchor = target?.closest("a");
            if (!anchor) return;
            if (anchor.getAttribute("data-no-leave-confirm") === "true") return;
            if (anchor.getAttribute("target") === "_blank") return;

            const href = anchor.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

            let url: URL;
            try {
                url = new URL(href, window.location.origin);
            } catch {
                return;
            }

            const isSameOrigin = url.origin === window.location.origin;
            const nextPath = isSameOrigin ? `${url.pathname}${url.search}${url.hash}` : url.toString();
            if (isSameOrigin && url.pathname.startsWith("/dashboard")) return;

            event.preventDefault();
            setPendingHref(nextPath);
            pendingActionRef.current = null;
            setIsLeaveDialogOpen(true);
        };

        document.addEventListener("click", handleClick, true);
        return () => document.removeEventListener("click", handleClick, true);
    }, []);

    const prevPathRef = useRef(pathname);

    useEffect(() => {
        const prevPath = prevPathRef.current;
        if (pathname !== prevPath && isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
        }
        prevPathRef.current = pathname;
    }, [pathname, isMobileMenuOpen]);

    const handleLeaveConfirm = async () => {
        setIsLeaveDialogOpen(false);
        const action = pendingActionRef.current;
        const href = pendingHref;
        pendingActionRef.current = null;
        setPendingHref(null);

        if (action) {
            await action();
            return;
        }
        if (!href) return;
        if (href.startsWith("http")) {
            window.location.href = href;
            return;
        }
        router.push(href);
    };

    const handleLeaveCancel = () => {
        setIsLeaveDialogOpen(false);
        pendingActionRef.current = null;
        setPendingHref(null);
    };

    if (shouldRedirectToDashboard) {
        return <div className="flex h-screen bg-white dark:bg-background" />;
    }

    return (
        <div className="flex h-screen bg-white dark:bg-background overflow-hidden font-sans">
            <AuthSessionGuard />
            {/* Desktop Sidebar - Fixed/Collapsible */}
            <div className="hidden md:block h-full z-40 transition-all duration-300">
                <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden relative w-full z-10">
                <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-2.5 pb-24 sm:p-4 sm:pb-24 md:p-5 md:pb-5 relative z-10 scroll-smooth">
                    {children}
                </main>

                <MobileBottomNav />
            </div>

            {/* Mobile Sidebar */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetContent
                    side="left"
                    className="w-[min(90vw,17rem)] p-0 border-r border-slate-900/[0.12] bg-white text-foreground dark:border-white/5 dark:bg-card"
                    closeButtonClassName="top-2.5 right-2.5 h-9 w-9 rounded-full border-sky-400/45 bg-[linear-gradient(160deg,rgba(255,255,255,0.95),rgba(224,242,254,0.92))] text-sky-700 shadow-[0_10px_24px_-16px_rgba(14,165,233,0.8)] hover:bg-[linear-gradient(160deg,rgba(240,249,255,0.95),rgba(186,230,253,0.9))] hover:text-sky-800 dark:border-sky-300/35 dark:bg-[linear-gradient(160deg,rgba(15,23,42,0.9),rgba(30,58,138,0.65))] dark:text-sky-200 dark:hover:bg-[linear-gradient(160deg,rgba(30,41,59,0.92),rgba(37,99,235,0.6))] dark:hover:text-white"
                >
                    <SheetHeader className="sr-only">
                        <SheetTitle>Mobile Navigation</SheetTitle>
                    </SheetHeader>
                    <Sidebar
                        collapsed={false}
                        setCollapsed={() => { }}
                        showCollapseToggle={false}
                        onNavigate={() => setIsMobileMenuOpen(false)}
                    />
                </SheetContent>
            </Sheet>

            <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
                <DialogContent className="max-w-[calc(100%-2rem)] rounded-2xl border border-slate-200/80 bg-white/95 p-5 text-slate-900 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] dark:border-slate-700/70 dark:bg-slate-950/95 dark:text-slate-100 sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">Leave dashboard?</DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                            You are about to exit the dashboard. Do you want to continue?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-end gap-2 pt-3">
                        <Button type="button" variant="outline" className="h-9" onClick={handleLeaveCancel}>
                            Stay
                        </Button>
                        <Button type="button" className="h-9" onClick={handleLeaveConfirm}>
                            Leave
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
