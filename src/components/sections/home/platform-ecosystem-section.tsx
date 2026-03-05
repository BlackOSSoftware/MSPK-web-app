"use client";

import { CheckCircle2, Shield, TrendingUp, Zap } from "lucide-react";

export default function PlatformEcosystemSection() {
    return (
        <section className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 relative z-10 overflow-hidden">
            {/* Background ambient lighting */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12 md:mb-20">
                <div className="text-center md:text-left max-w-4xl mx-auto md:mx-0">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tighter text-foreground leading-[1.1]">
                        The Infrastructure of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/70 to-primary animate-gradient-x">Modern Trading</span>
                    </h2>
                </div>
                <div className="flex flex-col items-start md:items-end gap-6 w-full md:w-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-sm font-semibold uppercase tracking-wider backdrop-blur-md shadow-xl">
                        <Zap className="w-4 h-4 fill-current" />
                        Powering Alpha
                    </div>
                    <p className="text-muted-foreground max-w-xl text-xl md:text-2xl leading-relaxed font-light text-left md:text-right">
                        Discard the grid. We built a direct pipeline to the markets.
                    </p>
                </div>
            </div>

            <div className="space-y-32">

                {/* Feature 1: Multi-Channel Alerts (HERO FEATURE) */}
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 group">
                    <div className="lg:w-1/2 space-y-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-500/50 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                            <Shield className="w-8 h-8 text-white fill-white/20" />
                        </div>
                        <h3 className="text-4xl md:text-5xl font-bold text-foreground">
                            Multi-Channel Alerts
                        </h3>
                        <p className="text-lg text-muted-foreground leading-loose">
                            Never miss a setup. Get instant notifications delivered to your preferred device the moment your strategy triggers.
                        </p>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-blue-500/10"><CheckCircle2 className="w-5 h-5 text-blue-500" /></div>
                                <span className="text-lg">WhatsApp, Telegram, & SMS</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-blue-500/10"><CheckCircle2 className="w-5 h-5 text-blue-500" /></div>
                                <span className="text-lg">&lt; 100ms Push Latency</span>
                            </div>
                        </div>
                    </div>
                    {/* Visual Mockup - Golden Notification Center (MATCHING ANALYTICS DIMENSIONS) */}
                    <div className="lg:w-1/2 w-full lg:h-[400px] relative">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/20 to-sky-500/5 rounded-[30px] blur-2xl opacity-60"></div>

                        {/* Notification Card (Sized to match Analytics) */}
                        <div className="relative h-full w-full bg-white dark:bg-[#0a0a0a] border border-black/5 dark:border-white/10 rounded-[20px] shadow-2xl overflow-hidden backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center ring-2 ring-white dark:ring-black"><span className="text-white text-[10px] font-bold">WA</span></div>
                                        <div className="w-8 h-8 rounded-full bg-[#229ED9] flex items-center justify-center ring-2 ring-white dark:ring-black"><span className="text-white text-[10px] font-bold">TG</span></div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white/90">Alerts Webhook</span>
                                </div>
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500/20 border border-sky-500/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                </div>
                            </div>

                            {/* Notifications List */}
                            <div className="flex-1 p-6 space-y-4 overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white dark:from-[#0a0a0a] to-transparent z-10"></div>

                                {/* Notification 1: WhatsApp */}
                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg flex gap-4 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer group/alert">
                                    <div className="w-10 h-10 rounded-full bg-[#25D366]/10 dark:bg-[#25D366]/20 flex items-center justify-center shrink-0">
                                        <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center"><span className="text-white text-[10px] font-bold">WA</span></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-sm text-[#25D366]">WhatsApp</span>
                                            <span className="text-[10px] text-slate-500 dark:text-white/40">Now</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-white/90 leading-snug"><b className="text-blue-600 dark:text-blue-400">NIFTY 50</b> crossed 24,500. <br />Signal: <span className="text-green-600 dark:text-green-400 font-bold">BUY CE</span></p>
                                    </div>
                                </div>

                                {/* Notification 2: Telegram */}
                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg flex gap-4 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer group/alert">
                                    <div className="w-10 h-10 rounded-full bg-[#229ED9]/10 dark:bg-[#229ED9]/20 flex items-center justify-center shrink-0">
                                        <div className="w-6 h-6 rounded-full bg-[#229ED9] flex items-center justify-center"><span className="text-white text-[10px] font-bold">TG</span></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-sm text-[#229ED9]">Telegram Premium</span>
                                            <span className="text-[10px] text-slate-500 dark:text-white/40">2m ago</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-white/90 leading-snug">Double Top detected on <b className="text-blue-600 dark:text-blue-400">BANKNIFTY</b> 15m chart.</p>
                                    </div>
                                </div>

                                {/* Notification 3: System */}
                                <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl border border-blue-200 dark:border-blue-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)] flex gap-4 relative overflow-hidden">
                                    <div className="absolute left-0 top-0 w-1 h-full bg-blue-500"></div>
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                                        <Zap className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-sm text-blue-600 dark:text-blue-500">System Alert</span>
                                            <span className="text-[10px] text-slate-500 dark:text-white/40">5m ago</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-slate-600 dark:text-white/70">
                                                <span>Daily P&L</span>
                                                <span className="text-green-600 dark:text-green-400 font-mono font-bold">INR 14,250.00</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 w-[75%]"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white dark:from-[#0a0a0a] to-transparent z-10 pointer-events-none"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature 2: Analytics (Golden Colors) */}
                <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-24 group">
                    {/* Visual Mockup */}
                    <div className="lg:w-1/2 w-full lg:h-[400px] relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-sky-600/20 rounded-[30px] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div className="relative h-full bg-white dark:bg-[#0a0a0a] border border-black/5 dark:border-white/10 rounded-[20px] shadow-2xl overflow-hidden p-8 flex items-end justify-center">
                            {/* Bar Chart Visualization - Golden */}
                            <div className="w-full flex items-end justify-between gap-2 h-48">
                                {[35, 55, 40, 70, 50, 85, 60, 95, 75, 50, 65, 80].map((h, i) => (
                                    <div key={i} className="flex-1 bg-gradient-to-t from-blue-500 dark:from-blue-600 to-sky-400 rounded-t-sm opacity-80 hover:opacity-100 transition-all duration-300 hover:scale-y-105 origin-bottom shadow-[0_0_10px_rgba(245,158,11,0.3)]" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                            <div className="absolute top-8 left-8">
                                <div className="text-sm text-slate-500 dark:text-white/50 uppercase tracking-wider mb-1">Total P&L</div>
                                <div className="text-4xl font-mono font-bold text-slate-900 dark:text-white">INR 4.2L</div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-1/2 space-y-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-500/50 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-500">
                            <TrendingUp className="w-8 h-8 text-white fill-white/20" />
                        </div>
                        <h3 className="text-4xl md:text-5xl font-bold text-foreground">
                            Deep Analytics
                        </h3>
                        <p className="text-lg text-muted-foreground leading-loose">
                            Comprehensive trading journals and performance reports to optimize your edge.
                        </p>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-purple-500/10"><CheckCircle2 className="w-5 h-5 text-purple-500" /></div>
                                <span className="text-lg">Strategy-wise Performance</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-purple-500/10"><CheckCircle2 className="w-5 h-5 text-purple-500" /></div>
                                <span className="text-lg">One-Click CSV/PDF Export</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
