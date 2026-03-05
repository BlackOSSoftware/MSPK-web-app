"use client";

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
    const heroRightImage =
        "https://images.unsplash.com/photo-1612461313144-fc1676a1bf17?q=80&w=1102&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

    const taglines = [
        "Institutional playbooks. Retail clarity.",
        "Verified structure. Confident execution.",
        "Live signals. Disciplined entries.",
        "Precision in, protected out.",
    ];

    const [taglineIndex, setTaglineIndex] = useState(0);
    const [displayText, setDisplayText] = useState("");
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const current = taglines[taglineIndex];

        let timeout: ReturnType<typeof setTimeout>;

        if (!isDeleting && charIndex < current.length) {
            // typing forward
            timeout = setTimeout(() => {
                setDisplayText(current.slice(0, charIndex + 1));
                setCharIndex((prev) => prev + 1);
            }, 45);
        }
        else if (!isDeleting && charIndex === current.length) {
            // pause at full text
            timeout = setTimeout(() => setIsDeleting(true), 1600);
        }
        else if (isDeleting && charIndex > 0) {
            // deleting backward
            timeout = setTimeout(() => {
                setDisplayText(current.slice(0, charIndex - 1));
                setCharIndex((prev) => prev - 1);
            }, 25);
        }
        else if (isDeleting && charIndex === 0) {
            // move to next sentence
            setIsDeleting(false);
            setTaglineIndex((prev) => (prev + 1) % taglines.length);
        }

        return () => clearTimeout(timeout);
    }, [charIndex, isDeleting, taglineIndex]);

    return (
        <section className="relative pt-14 pb-12 md:pb-20 overflow-hidden">

            {/* BACKGROUND SYSTEM */}
            <div className="absolute inset-0 z-0 bg-background">
                {/* Light theme wash */}
                <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white dark:hidden" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,0.18),transparent_45%),radial-gradient(circle_at_80%_16%,rgba(14,165,233,0.16),transparent_44%),radial-gradient(circle_at_50%_90%,rgba(250,204,21,0.12),transparent_48%)] dark:hidden" />

                {/* MOBILE TOP IMAGE */}
                <div className="hidden lg:block ..."></div>

                {/* mobile gradient fade */}
                <div className="lg:hidden absolute top-[35vh] left-0 w-full h-[15vh] bg-gradient-to-b from-transparent to-background" />

                {/* Existing glow */}
                <div className="absolute top-0 left-0 right-0 h-[500px] w-full bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-3xl opacity-40"></div>
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center lg:[grid-template-columns:minmax(0,1fr)_540px]">

                {/* Left Column: Text & CTAs */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 relative z-10 pt-12 sm:pt-16 lg:pt-0">

                    {/* Social Proof Pill */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Trusted by serious market participants
                    </div>

                    {/* Main Heading */}
                    <div className="relative">
                        <h1 className="font-heading text-2xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                            <span className="color-cycle">MSPK Signal Desk.</span>
                            <br />

                            <span className="flex flex-col lg:flex-row items-center lg:items-start gap-2 min-h-[1.5em] text-center lg:text-left lg:whitespace-nowrap">

                                <Zap className="h-5 w-5 text-primary animate-pulse shrink-0 mt-[2px]" />

                                {/* JS TYPEWRITER TEXT */}
                                <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                                    {displayText}
                                    <span className="text-blue-600 dark:text-blue-400 animate-pulse">|</span>
                                </span>

                            </span>

                        </h1>

                        <svg className="hidden lg:block absolute w-[120%] h-4 -bottom-2 -left-4 text-primary/20 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                        </svg>
                    </div>

                    {/* Subtext */}
                    <p className="max-w-[35rem] text-lg sm:text-xl text-muted-foreground leading-relaxed">
                        Institutional-grade market intelligence delivered with speed, structure, and accountability.
                        <span className="text-foreground font-medium"> Performance-first execution</span> for disciplined traders.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Link href="/trial" className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400 text-white font-bold shadow-[0_12px_40px_-16px_rgba(59,130,246,0.8)] hover:shadow-[0_18px_50px_-16px_rgba(59,130,246,0.9)] hover:scale-[1.02] transition-all"
                            >
                                Start Premium Trial
                            </Button>
                        </Link>
                        <Link href="/market" className="w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full sm:w-auto h-14 px-8 rounded-2xl border border-slate-200 bg-white/80 text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-semibold group transition-all dark:border-primary/30 dark:bg-white/5 dark:text-foreground/90 dark:hover:bg-primary/10 dark:hover:border-primary/60"
                            >
                                View Performance <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>

                    {/* Platform Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 w-full">
                        {/* keep your highlight cards EXACT same */}
                    </div>
                </div>

                {/* Right Column Image (DESKTOP ONLY - UNCHANGED) */}
                <div
                    className="relative hidden lg:block h-[600px] w-[200%] ml-auto -mr-[1rem] -translate-x-[24vw] overflow-hidden bg-cover bg-center brightness-[1.05] contrast-[1.02] saturate-[1.05] dark:brightness-[1.22] dark:contrast-[0.96] dark:saturate-[1.08] after:absolute after:inset-0 after:bg-gradient-to-l after:from-primary/20 after:via-transparent after:to-transparent after:content-[''] pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-background)]"
                    style={{
                        backgroundImage: `url("${heroRightImage}")`,
                        backgroundPosition: "20% center",
                        WebkitMaskImage:
                            "linear-gradient(90deg, transparent 0%, transparent 12%, rgba(0,0,0,0.55) 38%, black 60%)",
                        maskImage:
                            "linear-gradient(90deg, transparent 0%, transparent 12%, rgba(0,0,0,0.55) 38%, black 60%)",
                    }}
                ></div>

            </div>

            {/* Dashboard Preivew (Moved Below Split Hero) */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 mt-4 lg:mt-0 flex flex-col items-center gap-6 md:gap-8 text-center">
                {/* High-Fidelity Dashboard Mockup (Flat & Premium) */}
                {/* SIGNAL VALUE CANVAS */}
                <div className="relative w-full max-w-7xl mx-auto px-3 group mt-6 md:mt-8">

                    {/* soft glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition duration-500"></div>

                    <div className="relative rounded-xl border border-border bg-card shadow-xl overflow-hidden">

                        {/* background animated gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 animate-[pulse_8s_infinite]" />

                        <div className="relative p-10 lg:p-16 flex flex-col items-center text-center gap-10">

                            {/* MAIN QUOTE */}
                            <div className="max-w-3xl space-y-4">
                                <h3 className="text-2xl lg:text-3xl font-bold leading-tight">
                                    We deliver <span className="text-primary">high-probability signal frameworks</span>
                                    designed for consistency, clarity, and disciplined execution.
                                </h3>

                                <p className="text-muted-foreground text-sm lg:text-base">
                                    Our research-led process blends structure, liquidity, and risk controls
                                    to deliver actionable insights, not noise.
                                </p>
                            </div>

                            {/* KEY VALUE WORDS */}
                            <div className="w-full max-w-none sm:max-w-5xl space-y-4 overflow-hidden">

                                {/* ================= ROW 1 ================= */}
                                <div className="overflow-hidden">
                                    <div className="flex w-max animate-[marquee-left_25s_linear_infinite]">

                                        {/* GROUP 1 */}
                                        <div className="flex gap-3 pr-3">
                                            {[
                                                { label: "Precision", color: "from-blue-500/20 to-blue-500/5 border-blue-500/30" },
                                                { label: "Consistency", color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30" },
                                                { label: "Clarity", color: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30" },
                                                { label: "Discipline", color: "from-purple-500/20 to-purple-500/5 border-purple-500/30" },
                                                { label: "Confidence", color: "from-amber-500/20 to-amber-500/5 border-amber-500/30" },
                                                { label: "Structure", color: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/30" },
                                                { label: "Performance", color: "from-pink-500/20 to-pink-500/5 border-pink-500/30" },
                                                { label: "Reliability", color: "from-teal-500/20 to-teal-500/5 border-teal-500/30" },
                                                { label: "Focus", color: "from-orange-500/20 to-orange-500/5 border-orange-500/30" },
                                                { label: "Edge", color: "from-primary/20 to-primary/5 border-primary/30" },
                                            ].map((item, i) => (
                                                <div key={i} className={`px-2 py-1.5 sm:px-5 sm:py-4 rounded-xl bg-gradient-to-br ${item.color} backdrop-blur border text-xs sm:text-base font-semibold whitespace-nowrap`}>
                                                    {item.label}
                                                </div>
                                            ))}
                                        </div>

                                        {/* GROUP 2 (clone SAME order -> seamless) */}
                                        <div className="flex gap-3">
                                            {[
                                                { label: "Precision", color: "from-blue-500/20 to-blue-500/5 border-blue-500/30" },
                                                { label: "Consistency", color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30" },
                                                { label: "Clarity", color: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30" },
                                                { label: "Discipline", color: "from-purple-500/20 to-purple-500/5 border-purple-500/30" },
                                                { label: "Confidence", color: "from-amber-500/20 to-amber-500/5 border-amber-500/30" },
                                                { label: "Structure", color: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/30" },
                                                { label: "Performance", color: "from-pink-500/20 to-pink-500/5 border-pink-500/30" },
                                                { label: "Reliability", color: "from-teal-500/20 to-teal-500/5 border-teal-500/30" },
                                                { label: "Focus", color: "from-orange-500/20 to-orange-500/5 border-orange-500/30" },
                                                { label: "Edge", color: "from-primary/20 to-primary/5 border-primary/30" },
                                            ].map((item, i) => (
                                                <div key={i} className={`px-2 py-1.5 sm:px-5 sm:py-4 rounded-xl bg-gradient-to-br ${item.color} backdrop-blur border text-xs sm:text-base font-semibold whitespace-nowrap`}>
                                                    {item.label}
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                </div>

                                {/* ================= ROW 2 ================= */}
                                <div className="overflow-hidden">
                                    <div className="flex w-max animate-[marquee-right_28s_linear_infinite]">

                                        {/* GROUP 1 */}
                                        <div className="flex gap-3 pr-3">
                                            {[
                                                { label: "Edge", color: "from-primary/20 to-primary/5 border-primary/30" },
                                                { label: "Focus", color: "from-orange-500/20 to-orange-500/5 border-orange-500/30" },
                                                { label: "Reliability", color: "from-teal-500/20 to-teal-500/5 border-teal-500/30" },
                                                { label: "Performance", color: "from-pink-500/20 to-pink-500/5 border-pink-500/30" },
                                                { label: "Structure", color: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/30" },
                                                { label: "Confidence", color: "from-amber-500/20 to-amber-500/5 border-amber-500/30" },
                                                { label: "Discipline", color: "from-purple-500/20 to-purple-500/5 border-purple-500/30" },
                                                { label: "Clarity", color: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30" },
                                                { label: "Consistency", color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30" },
                                                { label: "Precision", color: "from-blue-500/20 to-blue-500/5 border-blue-500/30" },
                                            ].map((item, i) => (
                                                <div key={i} className={`px-4 py-3 sm:px-5 sm:py-4 rounded-xl bg-gradient-to-br ${item.color} backdrop-blur border text-xs sm:text-base font-semibold whitespace-nowrap`}>
                                                    {item.label}
                                                </div>
                                            ))}
                                        </div>

                                        {/* GROUP 2 */}
                                        <div className="flex gap-3">
                                            {[
                                                { label: "Edge", color: "from-primary/20 to-primary/5 border-primary/30" },
                                                { label: "Focus", color: "from-orange-500/20 to-orange-500/5 border-orange-500/30" },
                                                { label: "Reliability", color: "from-teal-500/20 to-teal-500/5 border-teal-500/30" },
                                                { label: "Performance", color: "from-pink-500/20 to-pink-500/5 border-pink-500/30" },
                                                { label: "Structure", color: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/30" },
                                                { label: "Confidence", color: "from-amber-500/20 to-amber-500/5 border-amber-500/30" },
                                                { label: "Discipline", color: "from-purple-500/20 to-purple-500/5 border-purple-500/30" },
                                                { label: "Clarity", color: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30" },
                                                { label: "Consistency", color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30" },
                                                { label: "Precision", color: "from-blue-500/20 to-blue-500/5 border-blue-500/30" },
                                            ].map((item, i) => (
                                                <div key={i} className={`px-2 py-1.5 sm:px-5 sm:py-4 rounded-xl bg-gradient-to-br ${item.color} backdrop-blur border text-xs sm:text-base font-semibold whitespace-nowrap`}>
                                                    {item.label}
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                </div>

                            </div>

                            {/* TRUST STRIP */}
                            <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground pt-4">

                                <span className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    Institutional methodology
                                </span>

                                <span className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    Multi-timeframe confluence
                                </span>

                                <span className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    Strict risk framework
                                </span>

                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
