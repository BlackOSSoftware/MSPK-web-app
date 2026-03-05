"use client";

import React from 'react';
import { ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';

interface Deal {
    id: string;
    symbol: string;
    strategy: string;
    type: 'Buy' | 'Sell';
    price: string;
    pnl: string;
    latency: string;
    status: 'Sent' | 'Failed' | 'Pending';
    date: string;
}

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        Sent: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        Failed: 'bg-red-500/10 text-red-500 border-red-500/20',
        Pending: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    };
    return (
        <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider border ${styles[status]}`}>
            {status}
        </span>
    );
};

export function RecentDealsTable() {
    const deals: Deal[] = [
        { id: '#8892', symbol: 'XAUUSD', strategy: 'Gold Rush V2', type: 'Buy', price: '2045.50', pnl: '+0.85%', latency: '4ms', status: 'Sent', date: 'Just now' },
        { id: '#8891', symbol: 'BTCUSD', strategy: 'Crypto Breakout', type: 'Sell', price: '42,500', pnl: '0.00%', latency: '12ms', status: 'Pending', date: '500ms ago' },
        { id: '#8890', symbol: 'US30', strategy: 'Index Scalper', type: 'Buy', price: '37,200', pnl: '+1.2%', latency: '2ms', status: 'Sent', date: '1 min ago' },
        { id: '#8889', symbol: 'EURUSD', strategy: 'Forex Major', type: 'Sell', price: '1.0950', pnl: '-0.15%', latency: '3ms', status: 'Sent', date: '3 mins ago' },
        { id: '#8888', symbol: 'GBPUSD', strategy: 'London Open', type: 'Buy', price: '1.2750', pnl: '+0.45%', latency: '5ms', status: 'Sent', date: '15 mins ago' },
    ];

    return (
        <div className="h-full bg-background/50 border border-white/5 rounded-xl shadow-xl flex flex-col overflow-hidden relative group hover:border-primary/50 transition-all duration-500">
            <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="h-12 shrink-0 border-b border-white/5 px-4 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-sm font-bold text-white/90 uppercase tracking-widest">Live Trade Alerts</h3>
                <Link href="/dashboard/alerts" className="text-xs text-primary hover:underline flex items-center gap-1">View All <ArrowRight size={12} /></Link>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-muted-foreground font-mono sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 font-medium border-b border-white/5">Trigger</th>
                            <th className="px-4 py-3 font-medium border-b border-white/5">Symbol</th>
                            <th className="px-4 py-3 font-medium border-b border-white/5">Strategy</th>
                            <th className="px-4 py-3 font-medium border-b border-white/5">Action</th>
                            <th className="px-4 py-3 font-medium border-b border-white/5">Price</th>
                            <th className="px-4 py-3 font-medium border-b border-white/5">Latency</th>
                            <th className="px-4 py-3 font-medium border-b border-white/5">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {deals.map((deal) => (
                            <tr key={deal.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-4 py-3 text-sm font-mono text-muted-foreground group-hover:text-primary transition-colors">{deal.id}</td>
                                <td className="px-4 py-3 text-sm font-bold text-white/90">{deal.symbol}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{deal.strategy}</td>
                                <td className="px-4 py-3 text-xs">
                                    <span className={`flex items-center gap-1 ${deal.type === 'Buy' ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {deal.type === 'Buy' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                        {deal.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm font-mono font-medium text-white/80">{deal.price}</td>
                                <td className={`px-4 py-3 text-xs font-mono font-medium text-muted-foreground`}>
                                    {deal.latency}
                                </td>
                                <td className="px-4 py-3"><StatusBadge status={deal.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary transition-all duration-700 group-hover:w-full"></div>
        </div>
    );
}
