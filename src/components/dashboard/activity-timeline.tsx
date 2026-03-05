"use client";

import React from 'react';
import { Clock, Shield, User, Activity, Bell, Cpu } from 'lucide-react';

export function ActivityTimeline() {
    const logs = [
        { id: 1, type: 'strategy', msg: 'Strategy "Gold Rush V2" Activated', time: '1 min ago' },
        { id: 2, type: 'signal', msg: 'XAUUSD Buy Alert Triggered', time: '2 mins ago' },
        { id: 3, type: 'api', msg: 'New API Key added for Binance', time: '10 mins ago' },
        { id: 4, type: 'login', msg: 'Login detected from New Device', time: '1 hour ago' },
        { id: 5, type: 'sys', msg: 'Market Data Feed Connected', time: '2 hours ago' },
    ];

    const getIcon = (type: string) => {
        switch (type) {
            case 'login': return { icon: Shield, color: 'text-emerald-500' };
            case 'strategy': return { icon: Cpu, color: 'text-blue-500' };
            case 'signal': return { icon: Activity, color: 'text-blue-500' };
            case 'api': return { icon: User, color: 'text-purple-500' };
            case 'sys': return { icon: Bell, color: 'text-muted-foreground' };
            default: return { icon: Activity, color: 'text-white/50' };
        }
    };

    return (
        <div className="h-full bg-background/50 border border-white/5 rounded-xl shadow-xl flex flex-col overflow-hidden relative group hover:border-primary/50 transition-all duration-500">
            <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="h-12 shrink-0 border-b border-white/5 px-4 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-sm font-bold text-white/90 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={16} className="text-primary" /> System Logs
                </h3>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {logs.map((log) => {
                    const { icon: Icon, color } = getIcon(log.type);
                    return (
                        <div key={log.id} className="group flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-default">
                            <div className={`mt-0.5 shrink-0 ${color}`}>
                                <Icon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground group-hover:text-white transition-colors truncate">
                                    {log.msg}
                                </p>
                                <span className="text-[11px] text-muted-foreground/50 font-mono flex items-center gap-1.5">
                                    <Clock size={10} /> {log.time}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary transition-all duration-700 group-hover:w-full"></div>
        </div>
    );
}
