"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const INTRO_DURATION_MS = 3200;
const BASE_LOGO_SIZE = 96;

type TargetState = {
    x: number;
    y: number;
    scale: number;
};

export default function IntroSplash() {
    const [active, setActive] = useState(false);
    const [target, setTarget] = useState<TargetState>({ x: 0, y: 0, scale: 0.5 });
    const logoRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        if (reduceMotion) {
            window.localStorage.setItem("mspk_intro_seen", "true");
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const force = params.has("intro");
        const seen = window.sessionStorage.getItem("mspk_intro_seen");
        if (!force && seen) return;

        setActive(true);
        document.body.classList.add("intro-active");
        document.body.style.overflow = "hidden";

        const timer = window.setTimeout(() => {
            setActive(false);
            document.body.style.overflow = "";
            document.body.classList.remove("intro-active");
            if (!force) window.sessionStorage.setItem("mspk_intro_seen", "true");
        }, INTRO_DURATION_MS);

        return () => {
            window.clearTimeout(timer);
            document.body.style.overflow = "";
            document.body.classList.remove("intro-active");
        };
    }, []);

    useLayoutEffect(() => {
        if (!active) return;

        const computeTarget = () => {
            const targetEl = document.getElementById("navbar-brand-logo");
            if (!targetEl) return;

            const targetBox = targetEl.getBoundingClientRect();
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const targetX = targetBox.left + targetBox.width / 2;
            const targetY = targetBox.top + targetBox.height / 2;

            const scale = Math.max(0.35, Math.min(1, targetBox.width / BASE_LOGO_SIZE));
            setTarget({
                x: targetX - centerX,
                y: targetY - centerY,
                scale,
            });
        };

        const raf = window.requestAnimationFrame(computeTarget);
        window.addEventListener("resize", computeTarget);

        return () => {
            window.cancelAnimationFrame(raf);
            window.removeEventListener("resize", computeTarget);
        };
    }, [active]);

    if (!active) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(59,130,246,0.26),transparent_46%),radial-gradient(circle_at_80%_12%,rgba(14,165,233,0.22),transparent_42%),radial-gradient(circle_at_60%_85%,rgba(99,102,241,0.2),transparent_48%)] dark:bg-[radial-gradient(circle_at_20%_18%,rgba(56,189,248,0.22),transparent_46%),radial-gradient(circle_at_80%_12%,rgba(59,130,246,0.24),transparent_42%),radial-gradient(circle_at_60%_85%,rgba(14,165,233,0.2),transparent_48%)]" />
            <div className="absolute inset-0 pointer-events-none opacity-75 [background-image:radial-gradient(circle,rgba(59,130,246,0.16)_1px,transparent_1px)] [background-size:24px_24px] dark:[background-image:radial-gradient(circle,rgba(14,165,233,0.18)_1px,transparent_1px)]" />
            <div className="absolute inset-0 opacity-70 mix-blend-screen animate-[intro-sheen_3.2s_ease-in-out_forwards] bg-[linear-gradient(120deg,transparent_8%,rgba(255,255,255,0.8)_24%,transparent_36%,transparent_60%,rgba(255,255,255,0.6)_72%,transparent_88%)] dark:mix-blend-soft-light dark:bg-[linear-gradient(120deg,transparent_8%,rgba(59,130,246,0.25)_24%,transparent_36%,transparent_60%,rgba(14,165,233,0.25)_72%,transparent_88%)]" />
            <div className="absolute inset-0 opacity-60 animate-[intro-float_6s_ease-in-out_infinite] bg-[radial-gradient(circle_at_40%_30%,rgba(255,255,255,0.4),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.25),transparent_42%)] dark:bg-[radial-gradient(circle_at_40%_30%,rgba(56,189,248,0.2),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.22),transparent_42%)]" />
            <div className="absolute inset-0 opacity-50 mix-blend-screen animate-[intro-rays_3.2s_ease-in-out_forwards] bg-[conic-gradient(from_180deg,transparent_0deg,rgba(255,255,255,0.4)_25deg,transparent_60deg,rgba(255,255,255,0.25)_90deg,transparent_140deg)] dark:mix-blend-soft-light dark:bg-[conic-gradient(from_180deg,transparent_0deg,rgba(59,130,246,0.25)_25deg,transparent_60deg,rgba(14,165,233,0.2)_90deg,transparent_140deg)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/35 to-white/70 dark:via-[#0a0a0a]/35 dark:to-[#0a0a0a]/70 opacity-0 animate-[intro-fade_3.2s_ease-in-out_forwards]" />

            <div className="relative w-full h-full">
                <div
                    ref={logoRef}
                    className="absolute left-1/2 top-1/2 w-24 h-24 rounded-2xl shadow-2xl overflow-hidden border border-black/10 dark:border-white/15 bg-white/85 dark:bg-white/10"
                    style={
                        {
                            "--logo-x": `${target.x}px`,
                            "--logo-y": `${target.y}px`,
                            "--logo-scale": `${target.scale}`,
                            animation: "intro-logo 3.2s cubic-bezier(0.22, 0.7, 0.2, 1) forwards",
                        } as React.CSSProperties
                    }
                >
                    <div className="absolute -inset-10 bg-[conic-gradient(from_200deg,rgba(59,130,246,0.7),rgba(14,165,233,0.55),rgba(99,102,241,0.45),rgba(59,130,246,0.7))] opacity-55 blur-2xl" />
                    <div className="absolute -inset-8 rounded-[26px] opacity-70 animate-[intro-halo_2.2s_ease-in-out_infinite] bg-[radial-gradient(circle,rgba(255,255,255,0.55),transparent_60%)] dark:bg-[radial-gradient(circle,rgba(56,189,248,0.3),transparent_60%)]" />
                    <div className="absolute -inset-6 rounded-[28px] border border-white/45 dark:border-white/25 opacity-0 animate-[intro-glow_2.6s_ease-in-out_infinite]" />
                    <Image src="/logo.jpg" alt="MSPK Trade Solutions logo" fill className="object-cover" priority />
                    <div className="absolute inset-0 ring-1 ring-white/45 dark:ring-white/20 pointer-events-none" />
                    <div className="absolute inset-0 opacity-0 animate-[intro-spark_3.2s_ease-in-out_forwards] bg-[linear-gradient(120deg,transparent_8%,rgba(255,255,255,0.9)_26%,transparent_44%)] dark:bg-[linear-gradient(120deg,transparent_8%,rgba(56,189,248,0.3)_26%,transparent_44%)]" />
                    <div className="absolute inset-0 opacity-0 animate-[intro-spark2_3.2s_ease-in-out_forwards] bg-[linear-gradient(300deg,transparent_12%,rgba(255,255,255,0.75)_28%,transparent_42%)] dark:bg-[linear-gradient(300deg,transparent_12%,rgba(14,165,233,0.3)_28%,transparent_42%)]" />
                </div>

                <div
                    className="absolute left-1/2 top-[calc(50%+96px)] -translate-x-1/2 text-center"
                    style={{ animation: "intro-text 2.8s ease-in-out forwards" }}
                >
                    <p className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                        MSPK
                    </p>
                    <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.32em] text-primary">
                        Trade Solutions
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-4 py-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground shadow-sm dark:border-white/10 dark:bg-white/5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(59,130,246,0.85)] dark:shadow-[0_0_14px_rgba(56,189,248,0.7)]" />
                     Precision That Moves Before the Market
                    </div>
                </div>
                <div className="absolute inset-0 pointer-events-none">
                    <span className="absolute left-[18%] top-[34%] h-1.5 w-1.5 rounded-full bg-white/70 blur-[1px] animate-[intro-twinkle_2.4s_ease-in-out_infinite]" />
                    <span className="absolute left-[70%] top-[28%] h-2 w-2 rounded-full bg-white/70 blur-[1px] animate-[intro-twinkle_2.8s_ease-in-out_infinite] [animation-delay:0.6s]" />
                    <span className="absolute left-[62%] top-[72%] h-1 w-1 rounded-full bg-white/70 blur-[1px] animate-[intro-twinkle_3s_ease-in-out_infinite] [animation-delay:1.1s]" />
                    <span className="absolute left-[30%] top-[70%] h-1.5 w-1.5 rounded-full bg-white/70 blur-[1px] animate-[intro-twinkle_2.6s_ease-in-out_infinite] [animation-delay:0.9s]" />
                    <span className="absolute left-[44%] top-[22%] h-2 w-2 rounded-full bg-white/70 blur-[1px] animate-[intro-twinkle_2.2s_ease-in-out_infinite] [animation-delay:1.3s]" />
                    <span className="absolute left-[78%] top-[58%] h-1.5 w-1.5 rounded-full bg-white/70 blur-[1px] animate-[intro-twinkle_2.5s_ease-in-out_infinite] [animation-delay:0.3s]" />
                </div>
            </div>

            <style jsx global>{`
                body.intro-active #navbar-brand-logo {
                    opacity: 0;
                    transform: scale(0.85);
                    transition: opacity 0.4s ease, transform 0.4s ease;
                }

                body.intro-active #navbar-brand-logo * {
                    pointer-events: none;
                }

                @keyframes intro-fade {
                    0% {
                        opacity: 0;
                    }
                    60% {
                        opacity: 0;
                    }
                    100% {
                        opacity: 1;
                    }
                }

                @keyframes intro-logo {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.7) rotate(0deg);
                    }
                    18% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.02) rotate(1deg);
                    }
                    52% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.06) rotate(-1deg);
                    }
                    78% {
                        opacity: 1;
                        transform: translate(calc(-50% + var(--logo-x)), calc(-50% + var(--logo-y)))
                            scale(calc(var(--logo-scale) * 1.05))
                            rotate(0.5deg);
                    }
                    100% {
                        opacity: 1;
                        transform: translate(calc(-50% + var(--logo-x)), calc(-50% + var(--logo-y)))
                            scale(var(--logo-scale))
                            rotate(0deg);
                    }
                }


                @keyframes intro-text {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, 12px);
                    }
                    22% {
                        opacity: 1;
                        transform: translate(-50%, 0);
                    }
                    64% {
                        opacity: 1;
                        transform: translate(-50%, 0);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -8px);
                    }
                }

                @keyframes intro-twinkle {
                    0%,
                    100% {
                        opacity: 0.2;
                        transform: scale(0.8);
                    }
                    50% {
                        opacity: 0.85;
                        transform: scale(1.2);
                    }
                }

                @keyframes intro-sheen {
                    0% {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    20% {
                        opacity: 0.65;
                        transform: translateY(0);
                    }
                    80% {
                        opacity: 0.65;
                        transform: translateY(-6px);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                }

                @keyframes intro-glow {
                    0%,
                    100% {
                        opacity: 0.2;
                        box-shadow: 0 0 22px rgba(59, 130, 246, 0.35), 0 0 40px rgba(14, 165, 233, 0.25);
                    }
                    50% {
                        opacity: 0.55;
                        box-shadow: 0 0 36px rgba(59, 130, 246, 0.55), 0 0 70px rgba(14, 165, 233, 0.4);
                    }
                }

                @keyframes intro-spark {
                    0% {
                        opacity: 0;
                        transform: translateX(-35%);
                    }
                    35% {
                        opacity: 0.9;
                        transform: translateX(0%);
                    }
                    70% {
                        opacity: 0.2;
                        transform: translateX(35%);
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(40%);
                    }
                }

                @keyframes intro-spark2 {
                    0% {
                        opacity: 0;
                        transform: translateX(30%);
                    }
                    40% {
                        opacity: 0.75;
                        transform: translateX(0%);
                    }
                    75% {
                        opacity: 0.15;
                        transform: translateX(-30%);
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(-40%);
                    }
                }

                @keyframes intro-halo {
                    0%,
                    100% {
                        opacity: 0.25;
                        transform: scale(0.98);
                    }
                    50% {
                        opacity: 0.7;
                        transform: scale(1.04);
                    }
                }

                @keyframes intro-float {
                    0%,
                    100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                @keyframes intro-rays {
                    0% {
                        opacity: 0;
                        transform: scale(0.98) rotate(0deg);
                    }
                    35% {
                        opacity: 0.55;
                        transform: scale(1.02) rotate(8deg);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(1.06) rotate(18deg);
                    }
                }
            `}</style>
        </div>
    );
}
