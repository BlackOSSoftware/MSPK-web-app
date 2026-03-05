import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wifi,
} from "lucide-react";

const whatsappNumber = "917770039037";

const whatsappMessage = [
  "Hi MSPK Team,",
  "I want access to the Live TradingView Chart with strategy signals and target mapping.",
  "Please share the onboarding steps for live chart room access.",
  "",
  "Name:",
  "City:",
  "Preferred Segment (NFO / MCX / Equity):",
].join("\n");

const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

const featureItems = [
  { title: "Live Market Feed", description: "Real-time market movement with active structure visibility.", icon: Activity },
  { title: "Strategy Overlay", description: "Clear BUY and SELL direction with confidence context.", icon: TrendingUp },
  { title: "Entry + SL + Targets", description: "Complete execution levels mapped directly on chart.", icon: Target },
  { title: "Risk Guardrails", description: "Defined invalidation and stop discipline for every setup.", icon: ShieldCheck },
];

const chartNotes = [
  "Current direction and trend confirmation in one view",
  "Entry trigger, stop-loss zone, and multi-target ladder",
  "Live update flow so you can react faster without confusion",
];

const accessSteps = [
  "Tap Get Access to open the prefilled WhatsApp message.",
  "Share your segment preference and trading style.",
  "Our team enables your TradingView live chart room access.",
];

export default function MarketPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_10%_10%,#123057_0%,#050b1c_40%,#020611_100%)] dark:text-slate-100">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-400/10" />
      <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-400/10" />

      <main className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-[0_25px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:p-10 dark:border-blue-200/20 dark:bg-slate-950/65 dark:shadow-[0_30px_80px_-40px_rgba(6,182,212,0.35)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/60 bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-cyan-300/35 dark:bg-cyan-500/10 dark:text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              MSPK Live Chart Access
            </div>

            <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
              MSPK Best Signals
              <span className="block bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent dark:from-cyan-300 dark:via-blue-300 dark:to-emerald-300">
                On TradingView, In Real Time
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
              This page clearly explains what you get: a live TradingView chart with strategy direction, entry,
              stop-loss, target levels, and real-time market movement. You do not get plain text alerts, you get
              execution-ready chart context.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {featureItems.map(({ title, description, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/70 hover:bg-white dark:border-blue-200/15 dark:bg-slate-900/70 dark:hover:border-cyan-300/45 dark:hover:bg-slate-900"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <Icon className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                    {title}
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_38px_-18px_rgba(16,185,129,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-[0_18px_42px_-18px_rgba(16,185,129,0.95)]"
              >
                <MessageCircle className="h-4 w-4" />
                Get Access on WhatsApp
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 dark:border-blue-200/25 dark:bg-slate-900/70 dark:text-slate-300">
                <Clock3 className="h-3.5 w-3.5 text-amber-500" />
                Live setup onboarding in chat
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-[0_22px_60px_-38px_rgba(2,132,199,0.55)] sm:p-8 dark:border-blue-200/20 dark:bg-slate-950/70">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Live Desk Status</p>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/70 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <Wifi className="h-3.5 w-3.5" />
                Connected
              </span>
            </div>

            <h2 className="mt-5 text-2xl font-bold leading-tight text-slate-900 dark:text-white">What Exactly You Get</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Signal context appears directly on the TradingView chart, so users can read setups clearly and make
              decisions faster.
            </p>

            <div className="mt-6 space-y-3">
              {chartNotes.map((note) => (
                <div
                  key={note}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-blue-200/15 dark:bg-slate-900/60"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">{note}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 p-4 dark:border-cyan-300/25 dark:from-cyan-500/10 dark:via-blue-500/10 dark:to-emerald-500/10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-cyan-200">Best For</p>
              <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Active traders who want live chart context and signal execution in a one-screen flow.
              </p>
            </div>
          </aside>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-5 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.35)] sm:p-7 dark:border-blue-200/20 dark:bg-slate-950/72">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Mock Live Chart</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">TradingView Strategy + Signal Preview</h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/70 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                <BarChart3 className="h-3.5 w-3.5" />
                Visual Preview
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-100/60 p-3 dark:border-blue-200/20 dark:bg-slate-900/80">
              <div className="relative h-[260px] overflow-hidden rounded-xl border border-slate-200 bg-[linear-gradient(160deg,#ffffff_0%,#f0f7ff_46%,#eaf4ff_100%)] p-4 sm:h-[330px] sm:p-5 dark:border-blue-200/20 dark:bg-[linear-gradient(160deg,#071127_0%,#0c1f3f_46%,#071b38_100%)]">
                <div className="absolute inset-0 opacity-40 dark:opacity-25 [background-image:linear-gradient(to_right,rgba(148,163,184,0.24)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:32px_32px]" />

                <svg viewBox="0 0 100 40" className="absolute left-4 right-4 top-8 h-[72%] w-[calc(100%-2rem)] text-cyan-500/90 dark:text-cyan-300/90">
                  <polyline
                    points="0,32 8,28 16,29 24,22 32,25 40,18 48,19 56,12 64,14 72,8 80,10 88,5 100,7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <polyline
                    points="0,36 8,34 16,31 24,33 32,30 40,31 48,26 56,27 64,23 72,22 80,19 88,16 100,13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.9"
                    opacity="0.45"
                  />
                </svg>

                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/70 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <TrendingUp className="h-3.5 w-3.5" />
                  BUY Signal Active
                </div>

                <div className="absolute bottom-4 left-4 right-4 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 dark:border-blue-200/20 dark:bg-slate-950/70">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Entry</p>
                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">22,450.25</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 dark:border-blue-200/20 dark:bg-slate-950/70">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Stop Loss</p>
                    <p className="mt-1 text-sm font-bold text-rose-600 dark:text-rose-300">22,400</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 dark:border-blue-200/20 dark:bg-slate-950/70">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Targets</p>
                    <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-300">22,500 / 22,550 / 22,600</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_50px_-34px_rgba(2,132,199,0.4)] dark:border-blue-200/20 dark:bg-slate-950/72">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">How To Get Access</p>
              <div className="mt-4 space-y-3">
                {accessSteps.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-blue-200/15 dark:bg-slate-900/60"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white dark:bg-cyan-500 dark:text-slate-950">
                      {index + 1}
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-[2rem] border border-emerald-300/70 bg-gradient-to-br from-emerald-500 to-cyan-500 p-6 text-white shadow-[0_28px_60px_-28px_rgba(16,185,129,0.75)] transition-transform duration-300 hover:-translate-y-1"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-50/90">Instant Chat CTA</p>
              <h4 className="mt-2 text-2xl font-black leading-tight">Get Live Chart Access Now</h4>
              <p className="mt-2 text-sm text-emerald-50/90">
                WhatsApp opens with a prefilled detailed request. Just send it, and onboarding starts immediately.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/15 px-4 py-2 text-sm font-semibold">
                Open WhatsApp
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
