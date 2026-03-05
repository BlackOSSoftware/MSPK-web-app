"use client";

import React from 'react';
import { CreditCard, Headphones, Settings, Wallet, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function QuickActions() {
    const router = useRouter();
    const ACTION_BUTTONS = [
        { icon: Settings, label: 'Add API Key', color: 'hover:bg-blue-500/20 hover:text-blue-500 hover:border-blue-500/30', path: '/dashboard/settings' },
        { icon: ArrowUpRight, label: 'New Strategy', color: 'hover:bg-emerald-500/20 hover:text-emerald-500 hover:border-emerald-500/30', path: '/dashboard/strategies/new' },
        { icon: Headphones, label: 'Support', color: 'hover:bg-purple-500/20 hover:text-purple-500 hover:border-purple-500/30', path: '/dashboard/support' },
        { icon: CreditCard, label: 'Upgrade', color: 'hover:bg-blue-500/20 hover:text-blue-500 hover:border-blue-500/30', path: '/dashboard/settings/billing' },
        { icon: Wallet, label: 'Reports', color: 'hover:bg-indigo-500/20 hover:text-indigo-500 hover:border-indigo-500/30', path: '/dashboard/reports' },
        { icon: Settings, label: 'Config', color: 'hover:bg-white/10 hover:text-white hover:border-white/20', path: '/dashboard/settings' },
    ];

    return (
        <div className="bg-background/50 border border-white/5 rounded-xl shadow-xl flex flex-col overflow-hidden h-full relative group hover:border-primary/50 transition-all duration-500">
            <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="h-11 shrink-0 border-b border-white/5 px-4 flex items-center justify-between bg-white/[0.02]">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Quick Actions</span>
            </div>

            <div className="p-3 grid grid-cols-3 gap-2.5 flex-1">
                {ACTION_BUTTONS.map((btn, idx) => (
                    <button
                        key={idx}
                        onClick={() => router.push(btn.path)}
                        className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-transparent bg-white/[0.03] transition-all duration-200 group ${btn.color}`}
                    >
                        <btn.icon size={18} className="text-muted-foreground group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-medium text-muted-foreground/85 group-hover:text-inherit text-center px-1">{btn.label}</span>
                    </button>
                ))}
            </div>
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary transition-all duration-700 group-hover:w-full"></div>
        </div>
    );
}
