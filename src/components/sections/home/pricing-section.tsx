"use client";

import Link from "next/link";
import { CheckCircle2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PricingPlan = {
    id: string;
    name: string;
    description: string;
    price: string;
    duration: string;
    features: string[];
    buttonText: string;
    href: string;
    isPopular: boolean;
};

type PricingSectionProps = {
    plans: PricingPlan[];
};

export default function PricingSection({ plans }: PricingSectionProps) {
    return (
        <section className="w-full max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10 overflow-hidden">
            {/* Background ambient lighting */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12 md:mb-20">
                <div className="text-center md:text-left max-w-4xl mx-auto md:mx-0">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tighter text-foreground leading-[1.1]">
                        Choose your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/70 to-primary animate-gradient-x">Trading Edge</span>
                    </h2>
                </div>
                <div className="flex flex-col items-start md:items-end gap-6 w-full md:w-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-sm font-semibold uppercase tracking-wider backdrop-blur-md shadow-xl">
                        <Wallet className="w-4 h-4 fill-current" />
                        Simple Pricing
                    </div>
                    <p className="text-muted-foreground max-w-xl text-xl md:text-2xl leading-relaxed font-light text-left md:text-right">
                        Transparent pricing. No hidden fees. Just results.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
                {plans.slice(0, 3).map((plan) => {
                    const isPopular = plan.isPopular;
                    return (
                        <div
                            key={plan.id}
                            className={`relative p-8 rounded-3xl border shadow-xl flex flex-col items-center text-center hover:translate-y-[-4px] transition-transform duration-300 ${isPopular
                                ? "border-blue-500/50 bg-slate-50 dark:bg-[#0a0a0a] shadow-2xl shadow-blue-500/20 ring-1 ring-blue-500/50 z-10 scale-105 transform"
                                : "border-white/10 bg-white dark:bg-white/5"
                            }`}
                        >
                            {isPopular && (
                                <div className="absolute top-0 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-sky-500 text-black font-bold px-4 py-1 rounded-full text-xs uppercase tracking-wider shadow-lg">
                                    Most Popular
                                </div>
                            )}
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-white/60">{plan.description}</p>
                            </div>
                            <div className="mb-8">
                                <span className="text-4xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                                <span className="text-sm text-slate-500 dark:text-white/40"> / {plan.duration}</span>
                            </div>
                            <ul className="space-y-4 mb-8 text-left w-full max-w-[240px] mx-auto">
                                {plan.features.slice(0, 4).map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-white/80">
                                        {isPopular ? (
                                            <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        )}
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-auto w-full">
                                <Link href={plan.href}>
                                    <Button
                                        size="lg"
                                        variant={isPopular ? "default" : "outline"}
                                        className={`w-full ${isPopular
                                            ? "bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-black font-bold shadow-lg shadow-blue-500/25"
                                            : "border-slate-200 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white"
                                        }`}
                                    >
                                        {plan.buttonText}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
