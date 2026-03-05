"use client";

import { Users } from "lucide-react";

export default function TestimonialsSection() {
    return (
        <section className="w-full max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10 overflow-hidden">
            {/* Background ambient lighting */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12 md:mb-20">
                <div className="text-center md:text-left max-w-4xl mx-auto md:mx-0">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tighter text-foreground leading-[1.1]">
                        Trusted by <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/70 to-primary animate-gradient-x">10,000+ Traders</span>
                    </h2>
                </div>
                <div className="flex flex-col items-start md:items-end gap-6 w-full md:w-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-sm font-semibold uppercase tracking-wider backdrop-blur-md shadow-xl">
                        <Users className="w-4 h-4 fill-current" />
                        Social Proof
                    </div>
                    <p className="text-muted-foreground max-w-xl text-xl md:text-2xl leading-relaxed font-light text-left md:text-right">
                        Don't just take our word for it. See what the community says.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-left">
                {/* Testimonial 1 */}
                <div className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 hover:-translate-y-2 transition-transform duration-300 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 group">
                    <div className="flex gap-1 mb-6">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <div key={s} className="w-5 h-5 text-blue-500 fill-current">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            </div>
                        ))}
                    </div>
                    <p className="text-lg text-slate-600 dark:text-gray-300 italic mb-8 leading-relaxed">"Finally a signal provider that is transparent with their P&L. I've recovered my past losses in just 2 months using the Pro plan."</p>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">RS</div>
                        <div>
                            <div className="font-bold text-foreground">Rahul S.</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pro Trader - Mumbai</div>
                        </div>
                    </div>
                </div>

                {/* Testimonial 2 */}
                <div className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 hover:-translate-y-2 transition-transform duration-300 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 group">
                    <div className="flex gap-1 mb-6">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <div key={s} className="w-5 h-5 text-blue-500 fill-current">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            </div>
                        ))}
                    </div>
                    <p className="text-lg text-slate-600 dark:text-gray-300 italic mb-8 leading-relaxed">"The latency is practically non-existent. Executing strategies via their API feels like having a direct line to the exchange."</p>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">PM</div>
                        <div>
                            <div className="font-bold text-foreground">Priya M.</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Algo Developer - Bangalore</div>
                        </div>
                    </div>
                </div>

                {/* Testimonial 3 */}
                <div className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 hover:-translate-y-2 transition-transform duration-300 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 group">
                    <div className="flex gap-1 mb-6">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <div key={s} className="w-5 h-5 text-blue-500 fill-current">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            </div>
                        ))}
                    </div>
                    <p className="text-lg text-slate-600 dark:text-gray-300 italic mb-8 leading-relaxed">"Most services repaint their signals, but these guys are legit. What you see on the dashboard is exactly what happened live."</p>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">AK</div>
                        <div>
                            <div className="font-bold text-foreground">Arjun K.</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Swing Trader - Delhi</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
