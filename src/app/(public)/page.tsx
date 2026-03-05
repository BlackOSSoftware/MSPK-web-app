"use client";

import { useMemo } from "react";
import { usePlansQuery } from "@/services/plans/plan.hooks";
import type { Plan } from "@/services/plans/plan.types";
import HeroSection from "@/components/sections/home/hero-section";
import PlatformEcosystemSection from "@/components/sections/home/platform-ecosystem-section";
import PricingSection, { type PricingPlan } from "@/components/sections/home/pricing-section";
import TestimonialsSection from "@/components/sections/home/testimonials-section";
import SocialMediaSection from "@/components/sections/home/social-media-section";

export default function Home() {
    const { data: plans = [] } = usePlansQuery();

    const fallbackPlans: PricingPlan[] = useMemo(
        () => [
            {
                id: "demo",
                name: "Demo Access",
                description: "Perfect for testing the waters",
                price: "Free",
                duration: "1 Day",
                features: ["Unlimited Strategies", "< 100ms Latency", "Deep Analytics & Export", "Priority 24/7 Support"],
                buttonText: "Start 1-Day Trial",
                href: "/trial",
                isPopular: false,
            },
            {
                id: "pro",
                name: "Pro Access",
                description: "For serious algorithmic traders",
                price: "INR 25,000",
                duration: "Month",
                features: ["Unlimited Strategies", "< 100ms Latency", "Deep Analytics & Export", "Priority 24/7 Support"],
                buttonText: "Get Started",
                href: "/pricing",
                isPopular: true,
            },
            {
                id: "enterprise",
                name: "Enterprise",
                description: "For Prop Desks & Funds",
                price: "Custom",
                duration: "Pricing",
                features: ["Dedicated Infrastructure", "White Label Solution", "FIX API Access", "Dedicated Account Manager"],
                buttonText: "Contact Sales",
                href: "/contact",
                isPopular: false,
            },
        ],
        []
    );

    const formattedPlans: PricingPlan[] = useMemo(() => {
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
                description: plan.description || "Premium access built for disciplined execution.",
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

    return (
        <div className="flex flex-col min-h-screen font-sans overflow-x-hidden">
            <HeroSection />
            <PlatformEcosystemSection />
            <PricingSection plans={formattedPlans} />
            <TestimonialsSection />
            <SocialMediaSection />
        </div>
    );
}
