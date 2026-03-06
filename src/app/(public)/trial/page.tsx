'use client';

import { Suspense, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Check, Loader2, Sparkles, Zap, Shield, ArrowRight, BadgeCheck, BarChart3 } from 'lucide-react';
import { useRegisterMutation, useSendOtpMutation, useVerifyOtpMutation } from '@/hooks/use-auth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { PrivacyPolicyModal } from '@/components/legal/privacy-policy-modal';

function TrialPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedPlanId = searchParams.get('planId');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
    const [otp, setOtp] = useState('');
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [formError, setFormError] = useState('');
    const [otpError, setOtpError] = useState('');
    const [acceptedPolicy, setAcceptedPolicy] = useState(false);
    const [isPolicyOpen, setIsPolicyOpen] = useState(false);
    const [formValues, setFormValues] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        city: '',
        tradingViewId: '',
        referralCode: '',
    });
    const segmentOptions = useMemo(
        () => [
            { id: 'nse', label: 'NSE' },
            { id: 'options', label: 'Options' },
            { id: 'mcx', label: 'MCX' },
            { id: 'forex', label: 'Forex' },
            { id: 'crypto', label: 'Crypto' },
            { id: 'all', label: 'All' },
        ],
        []
    );
    const [segments, setSegments] = useState<string[]>([]);
    const registerMutation = useRegisterMutation();
    const sendOtpMutation = useSendOtpMutation();
    const verifyOtpMutation = useVerifyOtpMutation();
    const getErrorMessage = (error: unknown, fallback: string) => {
        const apiMessage =
            typeof (error as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message === 'string'
                ? String((error as { response?: { data?: { message?: string } } })?.response?.data?.message)
                : typeof (error as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.error === 'string'
                    ? String((error as { response?: { data?: { error?: string } } })?.response?.data?.error)
                    : undefined;
        return apiMessage || (error instanceof Error ? error.message : fallback);
    };


    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setFormError('');

        const name = formValues.name.trim();
        const email = formValues.email.trim();
        const phone = formValues.phone.trim();
        const password = formValues.password.trim();
        const city = formValues.city.trim();
        const tradingViewId = formValues.tradingViewId.trim();
        const referralCode = formValues.referralCode.trim();

        try {
            if (!acceptedPolicy) {
                setFormError('Please accept the Privacy Policy to continue.');
                setLoading(false);
                return;
            }
            await registerMutation.mutateAsync({
                name,
                email,
                phone,
                password,
                city,
                tradingViewId: tradingViewId || undefined,
                referralCode: referralCode || undefined,
                segments,
                selectedPlanId,
            });
            await sendOtpMutation.mutateAsync({ type: 'email', identifier: email });
            setRegisteredEmail(email);
            setStep('otp');
            setFormValues({
                name: '',
                email: '',
                phone: '',
                password: '',
                city: '',
                tradingViewId: '',
                referralCode: '',
            });
            setSegments([]);
        } catch (error) {
            setFormError(getErrorMessage(error, 'Registration failed. Please try again.'));
        } finally {
            setLoading(false);
        }
    }

    async function onVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setOtpError('');

        try {
            await verifyOtpMutation.mutateAsync({ type: 'email', identifier: registeredEmail, otp: otp.trim() });
            setSuccess(true);
            setStep('success');
            router.replace('/login');
        } catch (error: unknown) {
            setOtpError(getErrorMessage(error, 'OTP verification failed.'));
        } finally {
            setLoading(false);
        }
    }

    async function onResendOtp() {
        if (!registeredEmail) return;
        setLoading(true);
        setOtpError('');
        try {
            await sendOtpMutation.mutateAsync({ type: 'email', identifier: registeredEmail });
        } catch (error: unknown) {
            setOtpError(getErrorMessage(error, 'Unable to resend OTP.'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white selection:bg-primary/30 transition-colors duration-300 relative overflow-hidden">
            {/* Background Grid & Spotlights */}
            <div className="absolute inset-0 z-0 w-full h-full pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.2]"></div>
                <div className="absolute top-0 left-0 right-0 h-[500px] w-full bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-3xl opacity-40"></div>
                <div className="absolute right-0 bottom-0 h-[400px] w-[400px] bg-primary/5 opacity-30 blur-[100px]"></div>
            </div>

            <div className="w-full max-w-7xl mx-auto mt-2 sm:mt-6 md:mt-8 px-3 sm:px-6 py-4 sm:py-8 md:py-14 relative z-10">
                <div className="sm:hidden mb-4 text-center">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">MSPK Trading Solution</p>
                    <h1 className="mt-1 text-xl font-heading font-bold text-slate-900 dark:text-white">Start Your Premium Trial</h1>
                </div>
                <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 sm:gap-8 lg:gap-8">

                    {/* Left Content: Value Props */}
                    <div className="hidden lg:block w-full lg:max-w-xl space-y-6 text-center lg:text-left animate-in fade-in slide-in-from-bottom-8 duration-700 order-2 lg:order-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3 fill-current animate-pulse" /> Premium Registration
                        </div>
                        <h1 className="text-4xl xl:text-6xl font-heading font-bold tracking-tighter leading-[0.95] text-slate-900 dark:text-white">
                            Create your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-primary/80 to-primary/50 filter drop-shadow-sm">Account</span>
                            <span className="text-primary">.</span>
                        </h1>
                        <p className="text-base xl:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                            Experience institutional-grade signal intelligence with guided onboarding.
                            <span className="block mt-2 font-medium text-slate-900 dark:text-white">Verify your email to activate instantly.</span>
                        </p>

                        <div className="grid gap-4 pt-2">
                            {[
                                { icon: Zap, title: "Real-time Signals", desc: "Receive alerts instantly via Telegram & Web." },
                                { icon: Shield, title: "Verified Performance", desc: "Access transparent signal outcomes and risk levels." },
                                { icon: Loader2, title: "Priority Support", desc: "Rapid onboarding and execution guidance." }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-primary/30 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{item.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 p-5 shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    <BadgeCheck className="h-3.5 w-3.5" /> Trusted by 5,000+ traders
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                    <BarChart3 className="h-3.5 w-3.5" /> Live Execution
                                </span>
                            </div>
                            <div className="relative overflow-hidden rounded-2xl">
                                <Image
                                    src="/trading-trust.svg"
                                    alt="Trusted trading insights"
                                    width={520}
                                    height={320}
                                    className="w-full h-auto"
                                    priority
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Content: Form Card */}
                    <div className="w-full lg:max-w-md animate-in fade-in slide-in-from-right-8 duration-700 delay-150 order-1 lg:order-2">
                        <Card className="border-0 shadow-2xl shadow-primary/5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl ring-1 ring-slate-200 dark:ring-white/10 rounded-[2rem] overflow-hidden">
                            {step === 'success' || success ? (
                                <div className="p-6 sm:p-12 text-center space-y-5 sm:space-y-6">
                                    <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Check className="w-10 h-10 stroke-[3]" />
                                    </div>
                                    <h2 className="text-3xl font-bold font-heading">You Are In!</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Your request is confirmed. Our onboarding team will contact you shortly to activate premium access.
                                    </p>
                                    <Button onClick={() => setSuccess(false)} variant="outline" className="w-full h-10 sm:h-12 rounded-xl mt-2 sm:mt-4">
                                        Request Another
                                    </Button>
                                    <Link href="/market" className="block w-full">
                                        <Button variant="ghost" className="w-full h-10 sm:h-12 rounded-xl text-primary hover:text-primary hover:bg-primary/5">
                                            Return to Market <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            ) : step === 'otp' ? (
                                <CardContent className="p-4 sm:p-8">
                                    <div className="mb-4 sm:mb-8">
                                        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Verify Your Email</h2>
                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                            OTP sent on your email: {registeredEmail}.
                                        </p>
                                    </div>

                                    <form onSubmit={onVerifyOtp} className="space-y-3 sm:space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="otp" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">OTP Code</Label>
                                            <Input
                                                id="otp"
                                                name="otp"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                required
                                                placeholder="Enter 6-digit code"
                                                className="h-10 sm:h-12 rounded-xl bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 focus:ring-primary/20 focus:border-primary px-4"
                                            />
                                        </div>

                                        {otpError ? (
                                            <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-100">
                                                {otpError}
                                            </div>
                                        ) : null}

                                        <Button
                                            type="submit"
                                            className="w-full h-11 sm:h-14 rounded-xl text-sm sm:text-base font-bold bg-primary text-black hover:bg-primary/90 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all duration-200 mt-1"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying...</>
                                            ) : (
                                                'Verify & Continue'
                                            )}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="w-full h-10 sm:h-12 rounded-xl text-primary hover:text-primary hover:bg-primary/5"
                                            onClick={onResendOtp}
                                            disabled={loading}
                                        >
                                            Resend OTP
                                        </Button>
                                        <p className="text-[11px] text-center text-muted-foreground">
                                            Already have an account?{' '}
                                            <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-4">
                                                Login
                                            </Link>
                                        </p>
                                    </form>
                                </CardContent>
                            ) : (
                                <CardContent className="p-4 sm:p-6">
                                    <div className="mb-3 sm:mb-5">
                                        <h2 className="text-lg sm:text-2xl font-bold mb-1">Create Your Account</h2>
                                        <p className="text-xs sm:text-sm text-muted-foreground">Share your details to register and verify your email.</p>
                                    </div>
                                    <div className="mb-4 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 px-4 py-3">
                                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                                            <Sparkles className="h-3.5 w-3.5" /> Premium Access
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                                            <span className="rounded-full border border-slate-200 dark:border-white/10 px-2 py-1">Instant OTP Verify</span>
                                            <span className="rounded-full border border-slate-200 dark:border-white/10 px-2 py-1">Priority Onboarding</span>
                                            <span className="rounded-full border border-slate-200 dark:border-white/10 px-2 py-1">Live Signals</span>
                                        </div>
                                    </div>

                                    <form onSubmit={onSubmit} className="space-y-3 sm:space-y-5">
                                        {formError ? (
                                            <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-100">
                                                {formError}
                                            </div>
                                        ) : null}
                                        <div className="grid gap-2.5 sm:gap-4 md:grid-cols-2">
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    value={formValues.name}
                                                    onChange={(e) => setFormValues((prev) => ({ ...prev, name: e.target.value }))}
                                                    required
                                                    placeholder="John Doe"
                                                    className="h-10 sm:h-11 rounded-xl bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 focus:ring-primary/20 focus:border-primary px-4"
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    value={formValues.email}
                                                    onChange={(e) => setFormValues((prev) => ({ ...prev, email: e.target.value }))}
                                                    required
                                                    placeholder="john@example.com"
                                                    className="h-10 sm:h-11 rounded-xl bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 focus:ring-primary/20 focus:border-primary px-4"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Phone Number</Label>
                                                <Input
                                                    id="phone"
                                                    name="phone"
                                                    type="tel"
                                                    value={formValues.phone}
                                                    onChange={(e) => setFormValues((prev) => ({ ...prev, phone: e.target.value }))}
                                                    required
                                                    placeholder="+91 98765 43210"
                                                    className="h-10 sm:h-11 rounded-xl bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 focus:ring-primary/20 focus:border-primary px-4"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">City</Label>
                                                <Input
                                                    id="city"
                                                    name="city"
                                                    value={formValues.city}
                                                    onChange={(e) => setFormValues((prev) => ({ ...prev, city: e.target.value }))}
                                                    required
                                                    placeholder="Mumbai"
                                                    className="h-10 sm:h-11 rounded-xl bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 focus:ring-primary/20 focus:border-primary px-4"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tradingViewId" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">TradingView ID (Optional)</Label>
                                                <Input
                                                    id="tradingViewId"
                                                    name="tradingViewId"
                                                    value={formValues.tradingViewId}
                                                    onChange={(e) => setFormValues((prev) => ({ ...prev, tradingViewId: e.target.value }))}
                                                    placeholder="e.g. trader_123"
                                                    className="h-10 sm:h-11 rounded-xl bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 focus:ring-primary/20 focus:border-primary px-4"
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Password</Label>
                                                <Input
                                                    id="password"
                                                    name="password"
                                                    type="password"
                                                    value={formValues.password}
                                                    onChange={(e) => setFormValues((prev) => ({ ...prev, password: e.target.value }))}
                                                    required
                                                    placeholder="********"
                                                    className="h-10 sm:h-11 rounded-xl bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 focus:ring-primary/20 focus:border-primary px-4"
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="referralCode" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Referral Code (Optional)</Label>
                                                <Input
                                                    id="referralCode"
                                                    name="referralCode"
                                                    value={formValues.referralCode}
                                                    onChange={(e) => setFormValues((prev) => ({ ...prev, referralCode: e.target.value }))}
                                                    placeholder="ABC123"
                                                    className="h-10 sm:h-11 rounded-xl bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 focus:ring-primary/20 focus:border-primary px-4"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Preferred Segments</Label>
                                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                {segmentOptions.map((segment) => {
                                                    const active = segments.includes(segment.id);
                                                    return (
                                                        <button
                                                            key={segment.id}
                                                            type="button"
                                                            onClick={() =>
                                                                setSegments((prev) =>
                                                                    prev.includes(segment.id)
                                                                        ? prev.filter((item) => item !== segment.id)
                                                                        : [...prev, segment.id]
                                                                )
                                                            }
                                                            className={`h-8 sm:h-9 rounded-full px-3 text-[11px] sm:text-xs font-semibold transition-all border ${
                                                                active
                                                                    ? "bg-primary text-black border-primary shadow-[0_10px_30px_-18px_rgba(59,130,246,0.7)]"
                                                                    : "bg-white/70 dark:bg-white/5 border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground"
                                                            }`}
                                                        >
                                                            {segment.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full h-10 sm:h-12 rounded-xl text-sm sm:text-base font-bold bg-primary text-black hover:bg-primary/90 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all duration-200 mt-1"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                                            ) : (
                                                'Create Account'
                                            )}
                                        </Button>

                                        <label className="mt-2 flex items-start gap-2 text-[11px] text-muted-foreground">
                                            <input
                                                type="checkbox"
                                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
                                                checked={acceptedPolicy}
                                                onChange={(e) => setAcceptedPolicy(e.target.checked)}
                                            />
                                            <span>
                                                I agree to the{' '}
                                                <button
                                                    type="button"
                                                    className="font-semibold text-primary hover:underline underline-offset-4"
                                                    onClick={() => setIsPolicyOpen(true)}
                                                >
                                                    Privacy Policy
                                                </button>
                                                .
                                            </span>
                                        </label>
                                        <p className="text-[11px] text-center text-muted-foreground">
                                            By continuing, you agree to our Terms of Service.
                                        </p>
                                        <p className="text-[11px] text-center text-muted-foreground">
                                            Already have an account?{' '}
                                            <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-4">
                                                Login
                                            </Link>
                                        </p>
                                    </form>
                                </CardContent>
                            )}
                        </Card>
                    </div>

                </div>
            </div>
            <PrivacyPolicyModal open={isPolicyOpen} onOpenChange={setIsPolicyOpen} />
        </div>
    );
}

export default function TrialPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white dark:bg-black" />}>
            <TrialPageContent />
        </Suspense>
    );
}
