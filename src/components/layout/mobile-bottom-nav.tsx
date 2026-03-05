"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CreditCard, Eye, House, Radio, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileNavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

const items: MobileNavItem[] = [
  { label: "Home", path: "/dashboard", icon: House },
  { label: "Signals", path: "/dashboard/signals", icon: Radio },
  { label: "Watch", path: "/dashboard/watchlist", icon: Eye },
  { label: "Calendar", path: "/dashboard/economic-calendar", icon: CalendarDays },
  { label: "Plan", path: "/dashboard/plans", icon: CreditCard },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) =>
    path === "/dashboard" ? pathname === "/dashboard" : pathname === path || pathname.startsWith(`${path}/`);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-2 pb-[max(env(safe-area-inset-bottom),0.45rem)] pt-1.5">
      <div className="mx-auto max-w-xl rounded-2xl border border-sky-300/35 bg-[linear-gradient(170deg,rgba(255,255,255,0.93),rgba(235,245,255,0.9))] p-1 shadow-[0_16px_40px_-28px_rgba(14,165,233,0.65)] backdrop-blur-xl dark:border-sky-300/20 dark:bg-[linear-gradient(170deg,rgba(2,8,30,0.95),rgba(8,20,48,0.9))]">
        <div className="grid grid-cols-5 gap-1">
          {items.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "group flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold transition-all duration-300",
                  active
                    ? "bg-sky-500/14 text-sky-700 dark:bg-sky-400/16 dark:text-sky-200"
                    : "text-slate-600 hover:bg-slate-900/[0.06] hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.07] dark:hover:text-white"
                )}
              >
                <Icon size={15} className={cn("transition-transform duration-300", !active && "group-hover:-translate-y-0.5")} />
                <span className="leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
