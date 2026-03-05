"use client";

import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SocialMediaSection() {
    return (
        <section className="w-full max-w-7xl mx-auto px-4 py-10 sm:py-14 md:py-24 relative z-10 overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0b0b0b] dark:via-[#0a0a0a] dark:to-[#0b0b0b]" />
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-[radial-gradient(circle,rgba(59,130,246,0.18),transparent_60%)]" />
                <div className="absolute top-24 right-0 w-[520px] h-[520px] bg-[radial-gradient(circle,rgba(14,165,233,0.18),transparent_60%)]" />
            </div>

            <div className="flex flex-col items-center text-center gap-4 sm:gap-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Social Media
                </div>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-heading font-bold tracking-tight text-foreground">
                    Get Social With Us!
                </h2>
                <p className="max-w-3xl text-sm sm:text-lg text-muted-foreground">
                    Stay updated with our latest news, products, services and campaigns. Follow us on our social media platforms for real-time insights.
                </p>
            </div>

            {/* Mobile mini social strip */}
            <div className="mt-6 grid grid-cols-5 gap-2 sm:gap-3 lg:hidden">
                {[
                    { label: "Instagram", icon: Instagram, color: "from-pink-500 to-yellow-400", href: "#" },
                    { label: "Facebook", icon: Facebook, color: "from-blue-600 to-sky-500", href: "#" },
                    { label: "WhatsApp", icon: MessageCircle, color: "from-emerald-500 to-lime-400", href: "#" },
                    { label: "X (Twitter)", icon: Twitter, color: "from-slate-900 to-slate-700", href: "#" },
                    { label: "YouTube", icon: Youtube, color: "from-red-600 to-rose-500", href: "#" },
                ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={i}
                            href={item.href}
                            aria-label={item.label}
                            className="bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl p-2 flex items-center justify-center shadow-sm"
                        >
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                                <Icon className="w-4 h-4 text-white" />
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px_1fr] items-center">
                {/* Left floating cards */}
                <div className="relative hidden lg:block h-[420px]">
                    <div className="absolute top-8 right-6 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-xl rounded-2xl p-4 w-56">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-yellow-400 flex items-center justify-center">
                                <Instagram className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-semibold">Instagram Page</div>
                                <div className="text-xs text-muted-foreground">@mspkfinance</div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-10 left-4 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-xl rounded-2xl p-4 w-52">
                        <div className="text-sm font-semibold text-foreground">Market Insights</div>
                        <div className="text-xs text-muted-foreground mt-1">Daily charts & momentum watchlist.</div>
                    </div>
                    <div className="absolute top-40 left-2 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-xl rounded-2xl p-4 w-52">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-semibold">WhatsApp</div>
                                <div className="text-xs text-muted-foreground">+91 77700 39037</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center phone mock */}
                <div className="relative mx-auto w-full max-w-[360px]">
                    <div className="absolute -inset-6 bg-gradient-to-br from-blue-500/20 to-sky-400/20 blur-2xl rounded-[40px]"></div>
                    <div className="relative rounded-[32px] border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-2xl p-6">
                        <div className="mx-auto h-5 w-24 rounded-full bg-slate-200 dark:bg-white/10 mb-6"></div>
                        <div className="flex flex-col items-center gap-4 py-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white font-bold text-xl">
                                MSPK
                            </div>
                            <div className="text-xl font-semibold text-foreground">Our Social Media</div>
                            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-500/15 to-sky-400/10 flex items-center justify-center">
                                <div className="w-28 h-28 rounded-full bg-white/80 dark:bg-white/10 border border-black/5 dark:border-white/10"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right floating cards */}
                <div className="relative hidden lg:block h-[420px]">
                    <div className="absolute top-10 left-6 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-xl rounded-2xl p-4 w-56">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center">
                                <Facebook className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-semibold">Facebook</div>
                                <div className="text-xs text-muted-foreground">@mspkfinance</div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-12 right-2 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-xl rounded-2xl p-4 w-56">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-black to-slate-700 flex items-center justify-center">
                                <Twitter className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-semibold">X (Twitter)</div>
                                <div className="text-xs text-muted-foreground">@mspkfinance</div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-44 left-0 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-xl rounded-2xl p-4 w-56">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center">
                                <Youtube className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-semibold">YouTube</div>
                                <div className="text-xs text-muted-foreground">@mspkfinance</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-10 hidden lg:flex flex-wrap justify-center gap-4">
                <Link href="#" className="w-full sm:w-auto">
                    <Button
                        size="lg"
                        className="w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-red-500 to-yellow-400 text-white font-semibold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
                    >
                        <Instagram className="w-5 h-5 mr-2" /> Instagram
                    </Button>
                </Link>
                <Link href="#" className="w-full sm:w-auto">
                    <Button
                        size="lg"
                        className="w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
                    >
                        <Facebook className="w-5 h-5 mr-2" /> Facebook
                    </Button>
                </Link>
                <Link href="#" className="w-full sm:w-auto">
                    <Button
                        size="lg"
                        className="w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 text-white font-semibold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
                    >
                        <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
                    </Button>
                </Link>
                <Link href="#" className="w-full sm:w-auto">
                    <Button
                        size="lg"
                        className="w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
                    >
                        <Twitter className="w-5 h-5 mr-2" /> X (Twitter)
                    </Button>
                </Link>
                <Link href="#" className="w-full sm:w-auto">
                    <Button
                        size="lg"
                        className="w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
                    >
                        <Youtube className="w-5 h-5 mr-2" /> YouTube
                    </Button>
                </Link>
            </div>
        </section>
    );
}
