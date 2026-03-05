"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Maximize2, ArrowUpRight } from 'lucide-react';
import { useTheme } from "next-themes";

interface UserPerformanceGraphProps {
    data?: Array<{ time: string; profit: number }>;
    totalProfit?: number;
    growth?: number;
}

export function UserPerformanceGraph({ data, totalProfit = 124500, growth = 15.2 }: UserPerformanceGraphProps) {
    const { resolvedTheme } = useTheme();
    const isLightTheme = resolvedTheme === "light";

    const chartData = data || [
        { time: '09:30', profit: 5000 },
        { time: '10:00', profit: 12000 },
        { time: '10:30', profit: 8500 },
        { time: '11:00', profit: 24000 },
        { time: '11:30', profit: 32000 },
        { time: '12:00', profit: 45000 },
        { time: '12:30', profit: 58000 },
    ];

    return (
        <div className="h-full flex flex-col bg-background/50 border border-white/5 rounded-xl shadow-xl overflow-hidden relative group hover:border-primary/50 transition-all duration-500">
            <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="h-14 border-b border-white/5 flex items-center justify-between px-5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                    <div className="flex flex-col">
                        <span className="text-base font-bold tracking-tight text-white/90 flex items-center gap-2">
                            STRATEGY PERFORMANCE
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2 text-muted-foreground hover:text-white transition-colors"><Maximize2 size={16} /></button>
                </div>
            </div>

            <div className="absolute top-[4.25rem] left-6 z-10 pointer-events-none">
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Portfolio Return</span>
                    <span className="text-3xl font-bold text-white tracking-tight flex items-end gap-2">
                        INR {totalProfit.toLocaleString('en-IN')}
                        <span className="text-base font-medium text-emerald-500 mb-1 flex items-center gap-1">
                            +{growth}% <ArrowUpRight size={14} />
                        </span>
                    </span>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0 pt-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12, fontFamily: 'monospace' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12, fontFamily: 'monospace' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#09090b',
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                boxShadow: isLightTheme ? "none" : '0 4px 12px rgba(0,0,0,0.5)',
                            }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}
                            labelStyle={{ color: '#a1a1aa', fontSize: '11px', marginBottom: '4px' }}
                            formatter={(value) => [`INR ${Number(value ?? 0).toLocaleString()}`, 'Profit']}
                        />
                        <Area
                            type="monotone"
                            dataKey="profit"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorProfit)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary transition-all duration-700 group-hover:w-full"></div>
        </div>
    );
}
