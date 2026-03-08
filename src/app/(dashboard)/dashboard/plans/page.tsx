"use client";

import { useMeQuery } from "@/hooks/use-auth";
import { usePlanQuery, usePlansQuery } from "@/services/plans/plan.hooks";
import type { Plan } from "@/services/plans/plan.types";
import { useSegmentsQuery } from "@/services/segments/segment.hooks";
import type { Segment } from "@/services/segments/segment.types";
import { useSubscriptionStatusQuery } from "@/services/subscriptions/subscription.hooks";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, ArrowLeft, ArrowRight, ShieldCheck, Crown, CalendarDays, Wallet, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, type MouseEvent } from "react";
import { useQueries } from "@tanstack/react-query";
import { getHasAccess } from "@/services/subscriptions/subscription.service";
import { useSwipeCards } from "@/hooks/use-swipe-cards";

const SEGMENT_CARD_THEMES = [
    {
        ribbon: "from-emerald-500 via-teal-500 to-cyan-500",
        glow: "bg-emerald-500/20 dark:bg-emerald-400/20",
        chipTone: "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        priceTone: "text-emerald-700 dark:text-emerald-300",
    },
    {
        ribbon: "from-sky-500 via-blue-500 to-indigo-500",
        glow: "bg-blue-500/20 dark:bg-sky-400/20",
        chipTone: "border-blue-500/35 bg-blue-500/10 text-blue-700 dark:text-blue-300",
        priceTone: "text-blue-700 dark:text-blue-300",
    },
    {
        ribbon: "from-orange-500 via-amber-500 to-yellow-500",
        glow: "bg-amber-500/20 dark:bg-amber-400/20",
        chipTone: "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        priceTone: "text-amber-700 dark:text-amber-300",
    },
] as const;

const PLAN_CARD_THEMES = [
    {
        surface: "from-card via-card/95 to-sky-500/10",
        glow: "bg-sky-500/22",
        tint: "bg-sky-500/14 text-sky-200 border-sky-400/35",
        bullet: "bg-sky-500/24 text-sky-200",
        button: "bg-[linear-gradient(135deg,#facc15_0%,#f59e0b_56%,#f97316_100%)] text-slate-950 shadow-[0_18px_38px_-16px_rgba(245,158,11,0.95)] ring-1 ring-amber-100/60 hover:shadow-[0_24px_44px_-14px_rgba(245,158,11,1)]",
    },
    {
        surface: "from-card via-card/95 to-emerald-500/10",
        glow: "bg-emerald-500/22",
        tint: "bg-emerald-500/14 text-emerald-200 border-emerald-400/35",
        bullet: "bg-emerald-500/24 text-emerald-200",
        button: "bg-[linear-gradient(135deg,#facc15_0%,#f59e0b_56%,#f97316_100%)] text-slate-950 shadow-[0_18px_38px_-16px_rgba(245,158,11,0.95)] ring-1 ring-amber-100/60 hover:shadow-[0_24px_44px_-14px_rgba(245,158,11,1)]",
    },
    {
        surface: "from-card via-card/95 to-rose-500/10",
        glow: "bg-rose-500/22",
        tint: "bg-rose-500/14 text-rose-200 border-rose-400/35",
        bullet: "bg-rose-500/24 text-rose-200",
        button: "bg-[linear-gradient(135deg,#facc15_0%,#f59e0b_56%,#f97316_100%)] text-slate-950 shadow-[0_18px_38px_-16px_rgba(245,158,11,0.95)] ring-1 ring-amber-100/60 hover:shadow-[0_24px_44px_-14px_rgba(245,158,11,1)]",
    },
] as const;

function formatPriceLabel(price?: number, isDemo?: boolean, name?: string) {
    const numericPrice = typeof price === "number" ? price : Number(price);
    if (isDemo) return "";
    if (!numericPrice || numericPrice <= 0) {
        return name && name.toLowerCase().includes("custom") ? "Custom" : "";
    }
    return `INR ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(numericPrice)}`;
}

function formatDurationLabel(durationDays?: number) {
    if (!durationDays) return "Flexible";
    return `${durationDays} Day${durationDays > 1 ? "s" : ""}`;
}

export default function PlansPage() {
    const { data: me } = useMeQuery();
    const planId = me?.planId ?? "";
    const { data: currentPlan } = usePlanQuery(planId, Boolean(planId));
    const { data: plans = [] } = usePlansQuery();
    const { data: segments = [] } = useSegmentsQuery();
    const { data: subscriptionStatus } = useSubscriptionStatusQuery();
    const visiblePlans = useMemo(() => {
        return plans.filter((plan) => !plan.isDemo && !plan.isCustom);
    }, [plans]);

    const loopedPlans = useMemo(
        () =>
            visiblePlans.length > 1
                ? Array.from({ length: visiblePlans.length * 3 }, (_, index) => ({
                    plan: visiblePlans[index % visiblePlans.length],
                    planIndex: index % visiblePlans.length,
                    virtualIndex: index,
                }))
                : visiblePlans.map((plan, index) => ({ plan, planIndex: index, virtualIndex: index })),
        [visiblePlans]
    );
    const { containerRef, activeIndex: activeVirtualIndex, isDragging, bind } = useSwipeCards(loopedPlans.length);

    const popularId = visiblePlans
        .filter((plan) => !plan.isDemo && !plan.isCustom)
        .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))[0]?._id;

    const segmentCards = useMemo(() => segments, [segments]);
    const accessQueries = useQueries({
        queries: segmentCards.map((segment) => ({
            queryKey: ["subscription", "access", segment.segment_code],
            queryFn: () => getHasAccess(segment.segment_code),
            enabled: Boolean(segment.segment_code),
        })),
    });

    const scrollToIndex = useCallback((targetIndex: number, behavior: ScrollBehavior = "smooth") => {
        const container = containerRef.current;
        if (!container) return;
        const children = Array.from(container.children) as HTMLElement[];
        if (!children.length) return;
        const boundedIndex = Math.max(0, Math.min(targetIndex, children.length - 1));
        const target = children[boundedIndex];
        if (!target) return;
        const left = target.offsetLeft - (container.clientWidth - target.offsetWidth) / 2;
        if (behavior === "auto") {
            const previousScrollBehavior = container.style.scrollBehavior;
            container.style.scrollBehavior = "auto";
            container.scrollTo({ left });
            container.style.scrollBehavior = previousScrollBehavior;
            return;
        }
        container.scrollTo({ left, behavior });
    }, [containerRef]);

    const showArrows = visiblePlans.length > 1;

    useEffect(() => {
        if (visiblePlans.length <= 1) return;
        scrollToIndex(visiblePlans.length, "auto");
    }, [visiblePlans.length, scrollToIndex]);

    useEffect(() => {
        if (visiblePlans.length <= 1) return;
        if (activeVirtualIndex < visiblePlans.length) {
            scrollToIndex(activeVirtualIndex + visiblePlans.length, "auto");
            return;
        }
        if (activeVirtualIndex >= visiblePlans.length * 2) {
            scrollToIndex(activeVirtualIndex - visiblePlans.length, "auto");
        }
    }, [activeVirtualIndex, visiblePlans.length, scrollToIndex]);

    const updateSegmentHoverPoint = useCallback((event: MouseEvent<HTMLElement>) => {
        const card = event.currentTarget;
        const bounds = card.getBoundingClientRect();
        card.style.setProperty("--spot-x", `${event.clientX - bounds.left}px`);
        card.style.setProperty("--spot-y", `${event.clientY - bounds.top}px`);
    }, []);
    const onChoosePlan = useCallback((plan: Plan) => {
        const whatsappNumber = "917770039037";
        const userName = me?.name?.trim() || "N/A";
        const userEmail = me?.email?.trim() || "N/A";
        const userPhone = me?.phone?.trim() || "N/A";
        const selectedPlanId = plan?._id || "N/A";
        const selectedPlanName = plan?.name || "N/A";
        const selectedPlanPrice = formatPriceLabel(plan?.price, plan?.isDemo, plan?.name);
        const selectedPlanDuration = formatDurationLabel(plan?.durationDays);
        const selectedPlanSegment = plan?.segment || "N/A";

        const message = [
            "Hello MSPK Team,",
            "",
            "I want to proceed with this plan:",
            `- Plan Name: ${selectedPlanName}`,
            `- Plan ID: ${selectedPlanId}`,
            `- Plan Price: ${selectedPlanPrice}`,
            `- Plan Duration: ${selectedPlanDuration}`,
            `- Segment: ${selectedPlanSegment}`,
            "",
            "User Details:",
            `- Name: ${userName}`,
            `- Email: ${userEmail}`,
            `- Phone: ${userPhone}`,
        ].join("\n");

        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }, [me]);
    const onExploreSegment = useCallback((segment: Segment, hasAccess: boolean | undefined, basePriceLabel: string) => {
        const whatsappNumber = "917770039037";
        const userName = me?.name?.trim() || "N/A";
        const userEmail = me?.email?.trim() || "N/A";
        const userPhone = me?.phone?.trim() || "N/A";
        const accessStatus = hasAccess === true ? "Access active" : hasAccess === false ? "No access" : "Checking access";

        const message = [
            "Hello MSPK Team,",
            "",
            "I want to explore this segment:",
            `- Segment Name: ${segment.name || "N/A"}`,
            `- Segment Code: ${segment.segment_code || "N/A"}`,
            `- Base Price: ${basePriceLabel}`,
            `- Access Status: ${accessStatus}`,
            "",
            "User Details:",
            `- Name: ${userName}`,
            `- Email: ${userEmail}`,
            `- Phone: ${userPhone}`,
        ].join("\n");

        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }, [me]);

    return (
        <div className="flex-1 space-y-6 sm:space-y-8 py-2">
            <div className="space-y-2 sm:space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Plan & Billing</h2>
                <p className="text-xs sm:text-sm text-slate-500">Manage your subscription, billing, and active access.</p>
            </div>

            {currentPlan ? (
                <Card className="plan-glow relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_55px_-30px_rgba(15,23,42,0.25)] transition-all duration-300 hover:-translate-y-0.5 dark:border-border/70 dark:bg-gradient-to-br dark:from-white/6 dark:via-white/5 dark:to-white/10 dark:shadow-[0_16px_48px_-20px_rgba(15,23,42,0.35)]">
                    <div className="pointer-events-none absolute left-0 top-0 z-20 select-none">
                        <div className="-translate-x-12 translate-y-5 rotate-[-45deg]">
                            <div className="relative">
                                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-14 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white shadow-[0_22px_50px_-18px_rgba(0,0,0,0.6)]">
                                    {currentPlan.isDemo || (typeof currentPlan.price === "number" && currentPlan.price <= 0) ? "Free" : "Best Choice"}
                                </div>
                                <div className="absolute inset-0 -z-10 bg-black/30 blur-[10px] translate-y-2" />
                                <div className="absolute inset-0 -z-20 bg-black/25 blur-[18px] translate-y-4 scale-[0.9]" />
                                <div className="absolute left-0 top-full h-0 w-0 border-l-[14px] border-l-amber-600 border-t-[10px] border-t-transparent" />
                                <div className="absolute right-0 top-full h-0 w-0 border-r-[14px] border-r-rose-600 border-t-[10px] border-t-transparent" />
                                <div className="absolute inset-0 rounded-[2px] ring-1 ring-white/30" />
                            </div>
                        </div>
                    </div>
                    <div className="pointer-events-none absolute -top-24 -right-10 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-amber-400/20 blur-3xl" />
                    <CardContent className="relative z-10 grid gap-6 p-6 sm:p-7 md:grid-cols-[1.2fr_0.8fr] md:items-center">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100/70 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-slate-700 dark:border-foreground/10 dark:bg-foreground/5 dark:text-muted-foreground">
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                Current Plan
                            </div>
                            <div className="space-y-2">
                                <div className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-foreground flex items-center gap-2">
                                    <Crown className="h-5 w-5 text-amber-500" />
                                    {currentPlan.name}
                                </div>
                                <div className="text-sm text-slate-700 dark:text-muted-foreground">
                                    {currentPlan.description}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100/70 px-3 py-1 text-xs text-slate-900 dark:border-foreground/10 dark:bg-foreground/5 dark:text-foreground">
                                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                                    {formatDurationLabel(currentPlan.durationDays)}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100/70 px-3 py-1 text-xs text-slate-900 dark:border-foreground/10 dark:bg-foreground/5 dark:text-foreground">
                                    <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                                    {formatPriceLabel(currentPlan.price, currentPlan.isDemo, currentPlan.name)}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-500">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    {subscriptionStatus?.hasActiveSubscription ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-3">
                            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-600 dark:text-muted-foreground">
                                Billing summary
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-100/70 px-4 py-3 text-sm text-slate-900 dark:border-foreground/10 dark:bg-foreground/5 dark:text-foreground w-full md:w-auto">
                                <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-muted-foreground">Plan Price</div>
                                <div className="mt-1 text-lg font-semibold">{formatPriceLabel(currentPlan.price, currentPlan.isDemo, currentPlan.name)}</div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-100/70 px-4 py-3 text-sm text-slate-900 dark:border-foreground/10 dark:bg-foreground/5 dark:text-foreground w-full md:w-auto">
                                <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-muted-foreground">Duration</div>
                                <div className="mt-1 text-lg font-semibold">{formatDurationLabel(currentPlan.durationDays)}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : null}

            <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-700 dark:border-foreground/10 dark:bg-foreground/5 dark:text-muted-foreground">
                    <Star className="h-3.5 w-3.5 text-amber-500" />
                    Plans Collection
                </div>
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="space-y-1">
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-foreground">
                            Choose the right plan for your trading style
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-muted-foreground">
                            Compare pricing, duration, and features before selecting your subscription.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-foreground/10 dark:bg-foreground/5 dark:text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        {visiblePlans.length} Plan{visiblePlans.length === 1 ? "" : "s"}
                    </div>
                </div>
            </div>

            <div className="relative mx-auto w-full max-w-[1180px]">
                <div
                    ref={containerRef}
                    {...bind}
                    className={`no-scrollbar flex gap-3 sm:gap-6 overflow-x-auto pb-5 px-1.5 sm:px-8 md:px-14 snap-x snap-mandatory scroll-smooth touch-pan-y items-stretch select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                >
                    {loopedPlans.map(({ plan, planIndex, virtualIndex: index }) => {
                        const isPopular = plan._id === popularId;
                        const isActive = index === activeVirtualIndex;
                        const theme = PLAN_CARD_THEMES[planIndex % PLAN_CARD_THEMES.length];
                        const planFeatures = (
                            plan.features?.length
                                ? plan.features
                                : ["Execution-grade routing", "Priority strategy support", "Performance reporting", "Managed onboarding"]
                        ).slice(0, 4);
                        const distance = Math.abs(index - activeVirtualIndex);
                        const depthClass = isActive
                            ? "scale-100 opacity-100 z-20"
                            : distance === 1
                                ? "scale-100 opacity-100 z-10 md:scale-[0.94] md:opacity-90"
                                : "scale-100 opacity-100 z-0 md:scale-[0.9] md:opacity-70";
                        return (
                            <Card
                                key={`${plan._id}-${index}`}
                                className={`plan-swipe-card plan-swap relative overflow-hidden rounded-[1.75rem] bg-card/95 transition-all duration-500 group flex min-h-[520px] sm:min-h-[560px] lg:min-h-[600px] flex-col snap-center shrink-0 w-[94%] sm:w-[78%] md:w-[430px] lg:w-[460px]
                                    ${isActive ? "plan-swipe-active" : ""}
                                    ${depthClass}
                                    ${isPopular
                                        ? "border-primary/60 shadow-[0_24px_62px_-20px_rgba(245,158,11,0.28)] ring-1 ring-primary/25"
                                        : "border-border/70 hover:border-primary/30 shadow-[0_10px_38px_-18px_rgba(15,23,42,0.2)] hover:shadow-[0_28px_60px_-20px_rgba(15,23,42,0.32)]"
                                    }`}
                            >
                                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${isPopular
                                    ? "from-card via-card/95 to-amber-500/12"
                                    : theme.surface
                                    }`} />
                                <div className={`pointer-events-none absolute -top-20 -right-16 h-44 w-44 rounded-full blur-3xl transition-transform duration-500 group-hover:scale-125 ${isPopular ? "bg-amber-500/24" : theme.glow}`} />
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,hsl(var(--foreground)/0.12),transparent_45%)]" />
                                <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${isPopular ? "from-transparent via-primary to-transparent" : "from-transparent via-foreground/20 to-transparent"}`} />

                                <CardHeader className="relative z-10 p-5 pb-2 sm:p-6 sm:pb-2">
                                    <div className="mb-3 flex items-center justify-between gap-2">
                                        {isPopular ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-primary/25">
                                                <Star className="w-3 h-3 fill-white" /> Most Popular
                                            </span>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${theme.tint}`}>
                                                <Sparkles className="h-3 w-3" />
                                                Smart Pick
                                            </span>
                                        )}
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            {formatDurationLabel(plan.durationDays)}
                                        </span>
                                    </div>
                                    <CardTitle className="text-xl font-bold text-foreground mb-2">{plan.name}</CardTitle>
                                    <CardDescription className="line-clamp-3 min-h-[3.75rem] text-muted-foreground">{plan.description}</CardDescription>
                                </CardHeader>

                                <CardContent className="relative z-10 p-5 sm:p-6 pt-3 flex flex-1 flex-col gap-5">
                                    <div className={`rounded-2xl border p-4 ${isPopular
                                        ? "border-amber-500/25 bg-amber-500/10 dark:border-amber-400/30 dark:bg-amber-500/10"
                                        : "border-border/70 bg-card/80"
                                        }`}>
                                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                                            Plan Price
                                        </div>
                                        <div className="mt-1 flex items-end gap-1.5">
                                            <span className="text-3xl font-bold tracking-tight text-foreground">{formatPriceLabel(plan.price, plan.isDemo, plan.name)}</span>
                                            <span className="pb-1 text-xs text-muted-foreground">/ {formatDurationLabel(plan.durationDays)}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 flex-1">
                                        {planFeatures.map((feature, featureIndex) => (
                                            <div key={featureIndex} className="flex items-start gap-3">
                                                <div
                                                    className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0
                                                    ${isPopular ? "bg-primary text-white" : theme.bullet}`}
                                                >
                                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                </div>
                                                <span className="text-sm leading-relaxed text-foreground/90 line-clamp-2">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>

                                <CardFooter className="relative z-10 p-5 sm:p-6 pt-0 mt-auto">
                                    <Button
                                        size="lg"
                                        onClick={() => onChoosePlan(plan)}
                                        className={`group/cta relative isolate w-full h-12 overflow-hidden rounded-xl text-sm font-bold tracking-wide transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0
                                        ${theme.button}`}
                                    >
                                        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.38),transparent_42%)]" />
                                        <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-22deg] bg-white/35 blur-sm opacity-0 transition-all duration-700 group-hover/cta:left-[120%] group-hover/cta:opacity-100" />
                                        <span className="relative z-10 inline-flex items-center justify-center">
                                            Choose Plan <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
                                        </span>
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                {showArrows ? (
                    <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-30 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => scrollToIndex(activeVirtualIndex - 1)}
                            aria-label="Previous plan"
                            className="pointer-events-auto relative z-40 ml-2 h-9 w-9 sm:h-11 sm:w-11 rounded-full border border-border/60 bg-white/80 text-foreground shadow-lg backdrop-blur transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-black/60"
                        >
                            <ArrowLeft className="mx-auto h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToIndex(activeVirtualIndex + 1)}
                            aria-label="Next plan"
                            className="pointer-events-auto relative z-40 mr-2 h-9 w-9 sm:h-11 sm:w-11 rounded-full border border-border/60 bg-white/80 text-foreground shadow-lg backdrop-blur transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-black/60"
                        >
                            <ArrowRight className="mx-auto h-5 w-5" />
                        </button>
                    </div>
                ) : null}
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Segments & Base Pricing</h3>
                    <p className="text-sm text-muted-foreground">Base prices for each active trading segment.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {segmentCards.map((segment, index) => {
                        const hasAccess = accessQueries[index]?.data?.hasAccess;
                        const theme = SEGMENT_CARD_THEMES[index % SEGMENT_CARD_THEMES.length];
                        const basePrice = typeof segment.base_price === "number" ? segment.base_price : Number(segment.base_price);
                        const hasBasePrice = Number.isFinite(basePrice) && basePrice > 0;
                        const basePriceLabel = hasBasePrice
                            ? `INR ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(basePrice)}`
                            : "Contact sales";
                        const accessLabel = hasAccess === true ? "Access active" : hasAccess === false ? "No access" : "Checking access";
                        const accessTone = hasAccess === true
                            ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : hasAccess === false
                                ? "border-rose-500/35 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                : "border-slate-300 bg-slate-100/80 text-slate-600 dark:border-foreground/10 dark:bg-white/5 dark:text-muted-foreground";

                        return (
                            <Card
                                key={segment._id}
                                role="button"
                                tabIndex={0}
                                onMouseEnter={updateSegmentHoverPoint}
                                onMouseMove={updateSegmentHoverPoint}
                                onClick={() => onExploreSegment(segment, hasAccess, basePriceLabel)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        onExploreSegment(segment, hasAccess, basePriceLabel);
                                    }
                                }}
                                className="segment-hover-fx group relative overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white/85 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_28px_55px_-30px_rgba(15,23,42,0.42)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/20 cursor-pointer"
                            >
                                <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.ribbon} opacity-80 transition-opacity duration-500 group-hover:opacity-100`} />
                                <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl transition-transform duration-500 group-hover:scale-125 ${theme.glow}`} />
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.22),transparent_45%)] dark:bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.08),transparent_45%)]" />

                                <CardHeader className="relative z-10 pb-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base text-slate-900 dark:text-foreground">{segment.name}</CardTitle>
                                            <CardDescription className="font-medium tracking-wide">{segment.segment_code}</CardDescription>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${theme.chipTone}`}>
                                            <Sparkles className="h-3 w-3" />
                                            Segment
                                        </span>
                                    </div>
                                </CardHeader>

                                <CardContent className="relative z-10 space-y-4 pt-0 text-sm text-muted-foreground">
                                    <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-3 transition-colors duration-300 group-hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:group-hover:border-white/20">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-muted-foreground">
                                            Base Price
                                        </div>
                                        <div className={`mt-2 flex items-center gap-2 text-lg font-semibold ${hasBasePrice ? theme.priceTone : "text-slate-700 dark:text-foreground"}`}>
                                            <Wallet className="h-4 w-4" />
                                            {basePriceLabel}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-3">
                                        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${accessTone}`}>
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            {accessLabel}
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onExploreSegment(segment, hasAccess, basePriceLabel);
                                            }}
                                            className="h-8 rounded-full px-3 text-xs font-semibold bg-[linear-gradient(135deg,#facc15_0%,#f59e0b_58%,#f97316_100%)] text-slate-950 shadow-[0_14px_28px_-16px_rgba(245,158,11,0.95)] hover:brightness-105"
                                        >
                                            Explore Now <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

