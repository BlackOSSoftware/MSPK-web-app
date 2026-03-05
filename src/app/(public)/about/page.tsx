"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Target, Shield, Users, Trophy, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useCmsFaqsQuery, useCmsPageQuery } from "@/services/cms/cms.hooks";

export default function AboutPage() {
  const words = ["Institutional Precision.", "Transparent Execution.", "Disciplined Growth."];
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      setTimeout(() => setReverse(true), 1200);
      return;
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 40 : 70);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  const FEATURES = [
    {
      title: "Precision-Led Research",
      description:
        "Our models evaluate market structure, liquidity zones, and volatility behavior to surface only high-conviction setups.",
      icon: Target,
    },
    {
      title: "Transparent Trade Logic",
      description:
        "Each signal is delivered with clearly defined entry, invalidation, and objective levels so decisions remain disciplined.",
      icon: Shield,
    },
    {
      title: "Institutional Delivery Speed",
      description:
        "Low-latency routing ensures insights reach your desk in time to act, not after the opportunity has passed.",
      icon: Zap,
    },
  ];

  const STATS = [
    { label: "Data Points Evaluated", value: "100M+" },
    { label: "Active Members", value: "10k+" },
    { label: "Model Confidence", value: "94%" },
    { label: "Years of R&D", value: "5+" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/30 transition-colors duration-300">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.15]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-7xl mx-auto mt-10 px-6 py-24 relative z-10">
        {/* CMS Content */}
        <CmsSection />
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-28">
          <div className="space-y-8 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
              <Users className="w-3 h-3 animate-pulse" />
              About MSPK
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-[1] tracking-tight">
              Built for Traders
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                Who Value Process.
              </span>
            </h1>

            <div className="text-2xl md:text-3xl font-semibold text-primary h-[40px]">
              {words[index].substring(0, subIndex)}
              <span className="animate-pulse">|</span>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              MSPK combines institutional-grade market infrastructure with practical execution frameworks,
              helping serious traders move from reactive decisions to consistent process-driven action.
            </p>

            <Link href="/plans">
              <Button size="lg" className="rounded-full px-8">
                Explore Plans <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="hidden lg:block">
            <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl p-10 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-2xl space-y-6">
              <TrendingUp className="w-10 h-10 text-primary" />
              <div className="text-xl font-bold">Our Mission</div>
              <p className="text-muted-foreground leading-relaxed text-sm">
                To bring institutional discipline to independent traders through clean signal logic,
                transparent communication, and execution-first product design.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-28 text-center">
          {STATS.map((stat, i) => (
            <div key={i} className="space-y-2">
              <div className="text-4xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-32">
          {FEATURES.map((feature, i) => (
            <Card
              key={i}
              className="bg-white dark:bg-black/50 border border-border rounded-[2rem] p-8 hover:shadow-xl hover:border-primary/30 transition-all duration-500 group"
            >
              <CardContent className="p-0">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="relative rounded-[3rem] overflow-hidden bg-slate-900 text-center px-6 py-24">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <Trophy className="w-16 h-16 text-primary mx-auto mb-8 animate-bounce" />

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Trade with Professional Structure?</h2>

            <p className="text-lg text-slate-300 mb-10 leading-relaxed">
              Build repeatable execution habits with a signal ecosystem designed for clarity, discipline, and long-term consistency.
            </p>

            <Link href="/plans">
              <Button
                size="lg"
                className="h-14 px-10 rounded-full text-base font-bold bg-primary text-black hover:bg-primary/90 hover:scale-105 transition-all duration-300"
              >
                View Plans <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function CmsSection() {
  const cmsPageQuery = useCmsPageQuery("about");
  const faqsQuery = useCmsFaqsQuery();

  return (
    <div className="mb-20 space-y-10">
      {cmsPageQuery.data?.content ? (
        <div className="rounded-[2rem] border border-border bg-white/70 dark:bg-white/5 backdrop-blur-xl p-8">
          <h2 className="text-2xl font-bold mb-4">{cmsPageQuery.data.title || "About"}</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {cmsPageQuery.data.content}
          </p>
        </div>
      ) : null}

      {Array.isArray(faqsQuery.data) && faqsQuery.data.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {faqsQuery.data.map((faq) => (
            <Card key={faq._id} className="bg-white dark:bg-black/50 border border-border rounded-[2rem] p-6">
              <CardContent className="p-0 space-y-3">
                <h3 className="text-lg font-semibold text-foreground">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
