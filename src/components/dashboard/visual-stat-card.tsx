"use client";

import React from 'react';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';

import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface VisualStatCardProps {
    title: string;
    value: string | number;
    change: string;
    type?: 'area' | 'bar' | 'radial';
    data?: Array<{ value: number }>;
    color?: string;
    subtext?: string;
    onClick?: () => void;
}

export function VisualStatCard({ title, value, change, type = 'area', data, color = '#f59e0b', subtext, onClick }: VisualStatCardProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    // Dynamic chart color adjusting for theme contrast if needed
    const chartColor = color;

    const renderChart = () => {
        const chartData = data || [
            { value: 10 }, { value: 20 }, { value: 35 }, { value: 25 }, { value: 40 }, { value: 15 }, { value: 30 }, { value: 20 }, { value: 45 }
        ];

        switch (type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <Bar dataKey="value" fill={chartColor} radius={[1, 1, 0, 0]} opacity={0.6} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'radial':
                const radialData = [{ name: 'L1', value: 100, fill: isDark ? '#1e293b' : '#e2e8f0' }, { name: 'L2', value: 75, fill: chartColor }];
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={6} data={radialData} startAngle={90} endAngle={-270}>
                            <RadialBar background={false} dataKey="value" cornerRadius={5} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                );
            case 'area':
            default:
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} fill={`url(#grad-${title.replace(/\s+/g, '')})`} />
                        </AreaChart>
                    </ResponsiveContainer>
                );
        }
    };

    const isPositive = !change.startsWith('-');
    const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

    return (
        <div
            className={cn(
                "h-full relative overflow-hidden group hover:border-primary/50 transition-all duration-500 bg-background/50 border border-white/5 rounded-xl shadow-xl",
                onClick ? 'cursor-pointer' : ''
            )}
            onClick={onClick}
        >
            {/* Cyber Grid Background */}
            <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none"></div>

            {/* Top Shine */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="p-4 relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-muted-foreground text-xs font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5">
                            {type === 'area' && <Activity size={12} className="text-primary" />}
                            {title}
                        </h3>
                        <p className="text-3xl font-bold text-foreground font-mono tracking-tighter tabular-nums" style={{ textShadow: `0 0 10px ${chartColor}40` }}>
                            {displayValue}
                        </p>
                    </div>
                    {change && (
                        <div className={cn(
                            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md border",
                            isPositive
                                ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5"
                                : "text-red-500 border-red-500/20 bg-red-500/5"
                        )}>
                            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {change}
                        </div>
                    )}
                </div>

                {subtext && (
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 w-1 rounded-full bg-primary animate-pulse"></div>
                        <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider opacity-80">{subtext}</p>
                    </div>
                )}
            </div>

            {/* Visual Background / Sparkline */}
            <div className={cn(
                "absolute bottom-0 right-0 z-0 opacity-30 transition-opacity group-hover:opacity-50",
                type === 'radial' ? 'w-16 h-16 right-1 bottom-1' : 'w-full h-16 bottom-0'
            )}>
                {renderChart()}
            </div>

            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary transition-all duration-700 group-hover:w-full"></div>
        </div>
    );
}
