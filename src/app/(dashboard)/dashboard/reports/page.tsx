"use client";

import React, { useState } from 'react';
import { Download, PieChart, TrendingUp, Calendar, Filter, ArrowUpRight, ArrowDownRight, DollarSign, Target, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

// Admin-Style Card Component
const StatCard = ({ title, value, change, positive }: { title: string, value: string, change?: string, positive?: boolean }) => (
    <div className="bg-card/50 border border-border p-4 rounded-xl relative overflow-hidden group hover:border-primary/50 transition-all shadow-sm">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target size={40} />
        </div>
        <div className="space-y-1 relative z-10">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</h4>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground font-mono">{value}</span>
                {change && (
                    <span className={cn("text-[10px] font-bold flex items-center", positive ? "text-emerald-500" : "text-red-500")}>
                        {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {change}
                    </span>
                )}
            </div>
        </div>
    </div>
);

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('performance');
    const [range, setRange] = useState('month');

    const trades = [
        { id: 'S-1024', date: '2024-01-20 14:30', strategy: 'Gold Rush V2', symbol: 'XAUUSD', type: 'BUY', entry: '2021.50', exit: '2024.10', points: '+26 pips', status: 'Target Hit' },
        { id: 'S-1023', date: '2024-01-20 12:15', strategy: 'Crypto Breakout', symbol: 'BTCUSD', type: 'SELL', entry: '41,200', exit: '41,350', points: '-150 pts', status: 'Stoploss Hit' },
        { id: 'S-1022', date: '2024-01-19 16:00', strategy: 'Gold Rush V2', symbol: 'XAUUSD', type: 'SELL', entry: '2018.00', exit: '2015.00', points: '+30 pips', status: 'Target Hit' },
        { id: 'S-1021', date: '2024-01-19 09:30', strategy: 'Forex Major', symbol: 'EURUSD', type: 'BUY', entry: '1.0850', exit: '1.0890', points: '+40 pips', status: 'Target Hit' },
        { id: 'S-1020', date: '2024-01-18 20:00', strategy: 'Crypto Breakout', symbol: 'ETHUSD', type: 'BUY', entry: '2,450', exit: '2,420', points: '-30 pts', status: 'Stoploss Hit' },
    ];

    return (
        <div className="h-full flex flex-col gap-6 max-w-6xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <PieChart className="text-primary" /> Signal Performance
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Review the accuracy and potential returns of your subscribed strategies.</p>
                </div>
                <button className="flex items-center gap-2 bg-card hover:bg-muted text-foreground border border-border px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm">
                    <Download size={14} /> Export Report
                </button>
            </div>

            {/* Disclaimer */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3 shrink-0">
                <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={16} />
                <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-blue-500">Performance Disclaimer</h4>
                    <p className="text-[10px] text-muted-foreground">These metrics represent the theoretical performance of signals sent to you. Actual trading results may vary due to spread, slippage, and execution speed.</p>
                </div>
            </div>

            {/* Admin Tabs */}
            <div className="flex items-center gap-1 border-b border-border shrink-0">
                {['Performance', 'Signal History', 'Accuracy'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '_'))}
                        className={cn(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2",
                            activeTab === tab.toLowerCase().replace(' ', '_')
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-6 pr-2">

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard title="Potential P/L" value="+2,450 pts" change="12.5%" positive={true} />
                    <StatCard title="Signal Accuracy" value="68.5%" change="2.1%" positive={true} />
                    <StatCard title="Signals Received" value="1,240" />
                    <StatCard title="Avg. Reward/Risk" value="1:2.4" change="0.2" positive={true} />
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
                        {['This Month', 'Last Quarter', 'Yearly'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r.toLowerCase().replace(' ', '_'))}
                                className={cn(
                                    "px-3 py-1 text-[10px] font-bold rounded transition-colors uppercase tracking-wide",
                                    range === r.toLowerCase().replace(' ', '_') ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Admin-Style Table */}
                <div className="w-full overflow-hidden rounded-xl border border-border bg-card/50 shadow-sm flex flex-col">
                    <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                            Signal History
                        </h3>
                        <Filter size={14} className="text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-muted/30 uppercase tracking-wider text-[10px] font-semibold text-muted-foreground border-b border-border font-mono">
                                <tr>
                                    <th className="px-6 py-3">Time Sent</th>
                                    <th className="px-6 py-3">Strategy</th>
                                    <th className="px-6 py-3">Symbol</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3 text-right">Entry Price</th>
                                    <th className="px-6 py-3 text-right">Exit Price</th>
                                    <th className="px-6 py-3 text-right">Result</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {trades.map((trade) => (
                                    <tr key={trade.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-3.5 text-muted-foreground font-mono text-xs">{trade.date}</td>
                                        <td className="px-6 py-3.5 font-bold text-foreground text-xs">{trade.strategy}</td>
                                        <td className="px-6 py-3.5 text-xs font-medium">{trade.symbol}</td>
                                        <td className="px-6 py-3.5 text-xs font-bold">
                                            <span className={trade.type === 'BUY' ? 'text-emerald-500' : 'text-red-500'}>{trade.type}</span>
                                        </td>
                                        <td className="px-6 py-3.5 font-mono text-right text-muted-foreground text-xs">{trade.entry}</td>
                                        <td className="px-6 py-3.5 font-mono text-right text-muted-foreground text-xs">{trade.exit}</td>
                                        <td className={cn("px-6 py-3.5 font-mono text-right font-bold text-xs", trade.status === 'Target Hit' ? 'text-emerald-500' : 'text-red-500')}>{trade.points}</td>
                                        <td className="px-6 py-3.5 text-center">
                                            <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border flex items-center justify-center gap-1", trade.status === 'Target Hit' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>
                                                {trade.status === 'Target Hit' && <Target size={10} />}
                                                {trade.status === 'Stoploss Hit' && <AlertTriangle size={10} />}
                                                {trade.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
