"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star, Zap, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePlansQuery } from "@/services/plans/plan.hooks";
import type { Plan } from "@/services/plans/plan.types";
import { useSwipeCards } from "@/hooks/use-swipe-cards";

export default function PlansPage() {
  const words = ["Scale With Confidence.", "Execute With Precision.", "Grow With Structure."];
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const { data: plans = [] } = usePlansQuery();

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      setTimeout(() => setReverse(true), 1000);
      return;
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 90 : 130);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  const fallbackPlans = useMemo(
    () => [
      {
        id: "demo",
        name: "Explorer Access",
        description: "Built for evaluating workflow, signal quality, and speed",
        price: "Free",
        duration: "1 Day",
        features: ["Core strategy feed", "Fast signal delivery", "Performance snapshots", "Guided onboarding support"],
        buttonText: "Start 1-Day Access",
        href: "/trial",
        isPopular: false,
      },
      {
        id: "pro",
        name: "Professional Access",
        description: "Designed for serious active traders and operators",
        price: "INR 25,000",
        duration: "Month",
        features: ["Full multi-strategy coverage", "Sub-100ms signal routing", "Deep analytics and exports", "Priority response support"],
        buttonText: "Activate Professional",
        href: "/trial",
        isPopular: true,
      },
      {
        id: "enterprise",
        name: "Institutional Suite",
        description: "Tailored for desks, teams, and managed capital mandates",
        price: "Custom",
        duration: "Pricing",
        features: ["Dedicated infrastructure", "White-label deployment", "FIX/API integrations", "Dedicated relationship manager"],
        buttonText: "Schedule Consultation",
        href: "/contact",
        isPopular: false,
      },
    ],
    []
  );

  const formattedPlans = useMemo(() => {
    if (!plans.length) return fallbackPlans;

    const popularId = plans
      .filter((plan) => !plan.isDemo)
      .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))[0]?._id;

    const formatPrice = (price?: number, isDemo?: boolean) => {
      if (!price || price <= 0 || isDemo) return "Free";
      const value = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(price);
      return `INR ${value}`;
    };

    const formatDuration = (durationDays?: number) => {
      if (!durationDays) return "Flexible";
      return `${durationDays} Day${durationDays > 1 ? "s" : ""}`;
    };

    return plans.map((plan: Plan) => {
      const isPopular = plan._id === popularId;
      const isDemo = Boolean(plan.isDemo);

      return {
        id: plan._id,
        name: plan.name,
        description: plan.description || "Premium access with execution-ready workflows.",
        price: formatPrice(plan.price, isDemo),
        duration: formatDuration(plan.durationDays),
        features: plan.features?.length
          ? plan.features
          : ["Execution-grade routing", "Priority strategy support", "Performance reporting", "Managed onboarding"],
        buttonText: isDemo ? "Start Demo Access" : "Activate Plan",
        href: `/trial?planId=${plan._id}`,
        isPopular,
      };
    });
  }, [fallbackPlans, plans]);

  const loopedPlans = useMemo(() => {
    if (!formattedPlans.length) return [];
    if (formattedPlans.length === 1) return formattedPlans;
    return [...formattedPlans, ...formattedPlans, ...formattedPlans];
  }, [formattedPlans]);

  const { containerRef, activeIndex, isDragging, bind } = useSwipeCards(loopedPlans.length);
  const isResettingRef = useRef(false);
  const [snapDisabled, setSnapDisabled] = useState(false);
  const [autoDirection, setAutoDirection] = useState<1 | -1>(1);
const getStep = (container: HTMLDivElement) => {
  const children = Array.from(container.children) as HTMLElement[];
  if (children.length < 2) return 0;
  return children[1].offsetLeft - children[0].offsetLeft;
};

const getSegmentWidth = (container: HTMLDivElement) => container.scrollWidth / 3;

const instantJump = (container: HTMLDivElement, nextLeft: number) => {
  const prev = container.style.scrollBehavior;
  container.style.scrollBehavior = "auto";
  container.scrollLeft = nextLeft;
  container.style.scrollBehavior = prev;
};

const wrapToMiddleIfNeeded = (container: HTMLDivElement) => {
  const segmentWidth = container.scrollWidth / 3;
  if (!segmentWidth) return;

  const left = container.scrollLeft;

  const leftThreshold = segmentWidth * 0.5;
  const rightThreshold = segmentWidth * 1.5;

  if (left < leftThreshold) {
    setSnapDisabled(true);
    instantJump(container, left + segmentWidth);
    requestAnimationFrame(() => setSnapDisabled(false));
  } else if (left > rightThreshold) {
    setSnapDisabled(true);
    instantJump(container, left - segmentWidth);
    requestAnimationFrame(() => setSnapDisabled(false));
  }
};
const scrollByStep = useCallback(
  (direction: 1 | -1, behavior: ScrollBehavior = "smooth") => {
    const container = containerRef.current;
    if (!container) return;

    wrapToMiddleIfNeeded(container);

    const children = Array.from(container.children) as HTMLElement[];
    if (children.length < 2) return;

    const step = children[1].offsetLeft - children[0].offsetLeft;
    if (!step) return;

    container.scrollTo({ left: container.scrollLeft + step * direction, behavior });
  },
  [containerRef]
);
  const showArrows = formattedPlans.length > 1;
  const getVirtualIndex = (idx: number, total: number) => {
    if (total <= 0) return 0;
    return ((idx % total) + total) % total;
  };
  const getCircularDistance = (idx: number, current: number, total: number) => {
    if (total <= 1) return 0;
    const delta = Math.abs(idx - current);
    return Math.min(delta, total - delta);
  };

  useEffect(() => {
    if (formattedPlans.length <= 1) return;
    const raf = window.requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const segmentWidth = container.scrollWidth / 3;
      container.scrollTo({ left: segmentWidth, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [formattedPlans.length, containerRef]);

  useEffect(() => {
    if (formattedPlans.length <= 1) return;
    if (isDragging) return;
    const interval = window.setInterval(() => {
      scrollByStep(autoDirection);
    }, 3200);
    return () => window.clearInterval(interval);
  }, [formattedPlans.length, isDragging, scrollByStep, autoDirection]);

  useEffect(() => {
    if (formattedPlans.length <= 1) return;
    const virtualIndex = getVirtualIndex(activeIndex, formattedPlans.length);
    if (autoDirection === 1 && virtualIndex === formattedPlans.length - 1) {
      setAutoDirection(-1);
    } else if (autoDirection === -1 && virtualIndex === 0) {
      setAutoDirection(1);
    }
  }, [activeIndex, autoDirection, formattedPlans.length]);

  useEffect(() => {
  if (formattedPlans.length <= 1) return;

  const container = containerRef.current;
  if (!container) return;

  const onScroll = () => {
    if (isResettingRef.current) return;

    isResettingRef.current = true;
    wrapToMiddleIfNeeded(container);

    requestAnimationFrame(() => {
      isResettingRef.current = false;
    });
  };

  container.addEventListener("scroll", onScroll, { passive: true });
  return () => container.removeEventListener("scroll", onScroll);
}, [formattedPlans.length, containerRef]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/30 transition-colors duration-300">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_82%_8%,rgba(34,197,94,0.16),transparent_36%),radial-gradient(circle_at_50%_88%,rgba(250,204,21,0.14),transparent_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.12]" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[780px] h-[360px] bg-primary/10 blur-[140px] rounded-full" />
      </div>

      <div className="w-full max-w-7xl mx-auto mt-10 px-5 sm:px-6 py-14 md:py-24 relative z-10">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center mb-20 md:mb-28">
          <div className="space-y-8 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] font-semibold uppercase tracking-[0.3em]">
              <Zap className="w-3 h-3 animate-pulse" />
              Membership Engine
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.03] tracking-tight text-foreground font-space">
              A plan system that
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-sky-300 to-emerald-300">
                scales with your desk.
              </span>
            </h1>

            <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-primary h-[32px] sm:h-[40px]">
              {words[index].substring(0, subIndex)}
              <span className="animate-pulse">|</span>
            </div>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Choose a membership that matches your execution speed, risk cadence, and operational depth.
              Every tier is designed for measurable outcomes and consistent delivery.
            </p>

            <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-4 sm:px-4">
                <div className="text-xl sm:text-2xl font-bold">10k+</div>
                <div className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wide">Active Members</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-4 sm:px-4">
                <div className="text-xl sm:text-2xl font-bold">99.9%</div>
                <div className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wide">Uptime</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-4 sm:px-4">
                <div className="text-xl sm:text-2xl font-bold">85%</div>
                <div className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wide">Signal Band</div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="metallic-surface rounded-[2rem] p-10 space-y-6">
              <div className="text-xs uppercase tracking-[0.3em] text-primary">Operational Blueprint</div>
              <div className="text-2xl font-semibold">What you unlock at scale</div>

              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-primary mt-1" />
                  Multi-strategy routing with live desk health metrics
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-primary mt-1" />
                  Tiered SLA response with dedicated advisory coverage
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-primary mt-1" />
                  Smart alerts for volatility, latency, and signal drift
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-primary mt-1" />
                  API-ready automation and instrumentation packages
                </div>
              </div>

              <Button className="w-full mt-6 rounded-xl">
                Explore Professional <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[1180px]">
          <div
            ref={containerRef}
            {...bind}
            className={`no-scrollbar mask-linear-fade flex gap-4 sm:gap-6 overflow-x-auto pb-8 px-2 sm:px-6 md:px-10 scroll-smooth touch-pan-y items-stretch select-none ${snapDisabled ? "snap-none" : "snap-x snap-mandatory"} ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          >
            {loopedPlans.map((plan, index) => {
              const isActive = index === activeIndex;
              const distance = getCircularDistance(index, activeIndex, loopedPlans.length + 1);
              const depthClass = isActive
                ? "scale-[1.06] opacity-100 z-20"
                : distance === 1
                  ? "scale-[0.98] opacity-90 z-10"
                  : "scale-[0.95] opacity-70 z-0";
              return (
                <Card
                  key={`${plan.id}-${index}`}
                  className={`plan-swipe-card relative overflow-hidden rounded-[1.75rem] transition-all duration-500 group flex h-[500px] sm:h-[540px] lg:h-[580px] flex-col snap-center shrink-0 w-[88%] sm:w-[70%] md:w-[48%] lg:w-[32%] min-w-[250px]
                    ${isActive ? "plan-swipe-active" : ""}
                    ${depthClass}
                    ${plan.isPopular
                      ? "bg-white/90 dark:bg-zinc-900 border-primary shadow-[0_20px_60px_-18px_rgba(56,189,248,0.35)] ring-1 ring-primary/30"
                      : "bg-white/85 dark:bg-black/50 border-white/10 shadow-[0_10px_45px_-15px_rgba(15,23,42,0.2)] hover:shadow-[0_26px_60px_-18px_rgba(15,23,42,0.25)] dark:shadow-none hover:border-primary/30"
                    }`}
                >
                {plan.isPopular && (
                  <div className="absolute top-4 right-4 z-20 rounded-full bg-primary px-4 py-1 text-[10px] font-bold uppercase tracking-[0.35em] text-black shadow-lg shadow-primary/30">
                    Premium
                  </div>
                )}

                <CardHeader className="p-6 pb-0">
                  <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="p-6 pt-6 flex-1">
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold tracking-tighter">{plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">/ {plan.duration}</span>
                  </div>

                  <div className="space-y-4 mb-8">
                    {plan.features.slice(0, 4).map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0
                            ${plan.isPopular ? "bg-primary text-black" : "bg-muted text-muted-foreground"}`}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className="text-sm leading-relaxed line-clamp-2">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="p-6 pt-0 mt-auto">
                  <Link href={plan.href} className="w-full">
                    <Button
                      size="lg"
                      className={`w-full h-12 rounded-xl text-sm font-bold transition-all duration-300
                        ${plan.isPopular
                          ? "bg-primary text-black hover:bg-primary/90 shadow-xl shadow-primary/20 hover:scale-[1.02]"
                          : "bg-foreground text-background hover:opacity-90"}`}
                    >
                      {plan.buttonText} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardFooter>
                </Card>
              );
            })}
          </div>

          {showArrows ? (
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-30 flex items-center justify-between">
              <button
                type="button"
                onClick={() => scrollByStep(-1)}
                aria-label="Previous plan"
                className="pointer-events-auto relative z-40 ml-1 sm:ml-2 h-9 w-9 sm:h-11 sm:w-11 rounded-full border border-border/60 bg-white/80 text-foreground shadow-lg backdrop-blur transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-black/60"
              >
                <ArrowLeft className="mx-auto h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollByStep(1)}
                aria-label="Next plan"
                className="pointer-events-auto relative z-40 mr-1 sm:mr-2 h-9 w-9 sm:h-11 sm:w-11 rounded-full border border-border/60 bg-white/80 text-foreground shadow-lg backdrop-blur transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-black/60"
              >
                <ArrowRight className="mx-auto h-5 w-5" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
