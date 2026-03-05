"use client";

import React, { useState } from 'react';
import { Zap } from 'lucide-react';

interface StrategyProps {
    id: string;
    name: string;
    status: 'Active' | 'Paused'; // Admin Status
    allocation: string;
    pnl: string;
    winRate: string;
    trades: number;
    description: string;
    segment?: string;
    timeframe?: string;
    isSubscribed?: boolean; // User Status
}

const StatusBadge = ({ status }: { status: string }) => {
    const isLive = status === 'Active';
    return (
        <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${isLive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-pulse' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
            <div className={`w-1 h-1 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
            {status}
        </span>
    );
};

export function StrategyCard({ data }: { data: StrategyProps }) {
    const [subscribed, setSubscribed] = useState(data.isSubscribed || false);
    const isProfitable = !data.pnl.startsWith('-');

    return (
        <div className={`group relative bg-background/50 border rounded-xl overflow-hidden transition-all duration-300 ${subscribed ? 'border-primary/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-white/5 hover:border-white/20'}`}>
            {/* Cyber Grid Background */}
            <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none"></div>

            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-start relative z-10">
                <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0">
                        <Zap size={18} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white/90 tracking-tight">{data.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            {data.segment && <span className="text-[11px] font-mono text-muted-foreground bg-white/5 px-2 py-1 rounded border border-white/5">{data.segment}</span>}
                            {data.timeframe && <span className="text-[11px] font-mono text-muted-foreground bg-white/5 px-2 py-1 rounded border border-white/5">{data.timeframe}</span>}
                        </div>
                    </div>
                </div>
                <StatusBadge status={data.status} />
            </div>

            {/* Stats Grid */}
            <div className="p-4 grid grid-cols-3 gap-4 relative z-10">
                <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">Return</span>
                    <p className={`text-lg font-mono font-bold ${isProfitable ? 'text-emerald-500' : 'text-red-500'}`}>
                        {data.pnl}
                    </p>
                </div>
                <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">Win Rate</span>
                    <p className="text-lg font-mono font-bold text-white/90">{data.winRate}</p>
                </div>
                <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">Signals</span>
                    <p className="text-lg font-mono font-bold text-white/90">{data.trades}</p>
                </div>
            </div>

            {/* Footer / Actions */}
            <div className="px-4 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between relative z-10">
                <span className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">{data.description}</span>

                <button
                    onClick={() => setSubscribed(!subscribed)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${subscribed ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20' : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'}`}
                >
                    {subscribed ? (
                        <>Unsubscribe</>
                    ) : (
                        <>Subscribe</>
                    )}
                </button>
            </div>

            {/* Bottom Access Line */}
            <div className={`absolute bottom-0 left-0 h-[2px] transition-all duration-500 w-0 group-hover:w-full ${subscribed ? 'bg-primary' : 'bg-white/20'}`}></div>
        </div>
    );
}
