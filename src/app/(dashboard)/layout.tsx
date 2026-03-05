"use client";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AuthSessionGuard } from "@/components/auth/auth-session-guard";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

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
                    <Sidebar collapsed={false} setCollapsed={() => { }} showCollapseToggle={false} />
                </SheetContent>
            </Sheet>
        </div>
    );
}
