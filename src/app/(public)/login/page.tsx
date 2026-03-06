'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Lock, Mail, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useLoginMutation, useSendOtpMutation, useVerifyOtpMutation } from '@/hooks/use-auth';
import { useRegisterFcmTokenMutation } from '@/services/notifications/notification.hooks';
import { getFcmToken } from '@/lib/fcm';

export default function LoginPage() {
    const router = useRouter();
    const loginMutation = useLoginMutation();
    const sendOtpMutation = useSendOtpMutation();
    const verifyOtpMutation = useVerifyOtpMutation();
    const registerFcmTokenMutation = useRegisterFcmTokenMutation();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loginError, setLoginError] = useState('');
    const [otpError, setOtpError] = useState('');
    const [otpNotice, setOtpNotice] = useState('');
    const [showVerify, setShowVerify] = useState(false);
    const loading = loginMutation.isPending;

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setLoginError('');
        setOtpError('');
        setOtpNotice('');
        setShowVerify(false);

        try {
            await loginMutation.mutateAsync({ email, password });
            if (typeof window !== 'undefined') {
                void (async () => {
                    try {
                        const storedToken =
                            window.localStorage.getItem('fcm_token') || window.localStorage.getItem('fcmToken');
                        const token = await getFcmToken();
                        if (token && token !== storedToken) {
                            window.localStorage.setItem('fcm_token', token);
                        }
                        if (token) {
                            await registerFcmTokenMutation.mutateAsync({ token });
                        }
                    } catch {
                        // ignore FCM registration issues during login
                    }
                })();
            }
            toast.success('Login successful');
            router.replace('/dashboard');
        } catch (error: unknown) {
            const message =
                typeof (error as { response?: { data?: { message?: string } } })?.response?.data?.message === 'string'
                    ? String((error as { response?: { data?: { message?: string } } })?.response?.data?.message)
                    : error instanceof Error
                        ? error.message
                        : 'Login failed';
            setLoginError(message);
            toast.error(message);
            if (message.toLowerCase().includes('verify') || message.toLowerCase().includes('otp')) {
                setShowVerify(true);
            }
        }
    }

    async function onSendOtp() {
        setOtpError('');
        setOtpNotice('');
        if (!email.trim()) {
            setLoginError('Enter your email to resend OTP.');
            setShowVerify(true);
            return;
        }
        try {
            await sendOtpMutation.mutateAsync({ type: 'email', identifier: email.trim() });
            setShowVerify(true);
            setOtpNotice(`OTP sent on your email: ${email.trim()}.`);
        } catch (error: unknown) {
            const message =
                typeof (error as { response?: { data?: { message?: string } } })?.response?.data?.message === 'string'
                    ? String((error as { response?: { data?: { message?: string } } })?.response?.data?.message)
                    : error instanceof Error
                        ? error.message
                        : 'Unable to send OTP.';
            setOtpError(message);
            setShowVerify(true);
        }
    }

    async function onVerifyOtp() {
        setOtpError('');
        try {
            await verifyOtpMutation.mutateAsync({ type: 'email', identifier: email.trim(), otp: otp.trim() });
            if (typeof window !== 'undefined') {
                void (async () => {
                    try {
                        const storedToken =
                            window.localStorage.getItem('fcm_token') || window.localStorage.getItem('fcmToken');
                        const token = await getFcmToken();
                        if (token && token !== storedToken) {
                            window.localStorage.setItem('fcm_token', token);
                        }
                        if (token) {
                            await registerFcmTokenMutation.mutateAsync({ token });
                        }
                    } catch {
                        // ignore FCM registration issues during OTP verification
                    }
                })();
            }
            toast.success('Email verified');
            router.replace('/dashboard');
        } catch (error: unknown) {
            const message =
                typeof (error as { response?: { data?: { message?: string } } })?.response?.data?.message === 'string'
                    ? String((error as { response?: { data?: { message?: string } } })?.response?.data?.message)
                    : error instanceof Error
                        ? error.message
                        : 'OTP verification failed.';
            setOtpError(message);
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/30 transition-colors duration-300">
            <div className="absolute inset-0 z-0 w-full h-full pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.2]"></div>
                <div className="absolute top-0 left-0 right-0 h-[500px] w-full bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-3xl opacity-40"></div>
            </div>

            <div className="w-full max-w-7xl mx-auto mt-2 sm:mt-6 md:mt-10 px-4 sm:px-6 py-4 sm:py-8 md:py-16 relative z-10">
                <div className="sm:hidden mb-4 text-center">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">MSPK Trading Solution</p>
                    <h1 className="mt-1 text-xl font-heading font-bold text-slate-900 dark:text-white">Secure Client Login</h1>
                </div>
                <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 sm:gap-10 lg:gap-8">
                    <div className="hidden lg:block w-full lg:max-w-xl space-y-8 text-center lg:text-left pt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 order-2 lg:order-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                            <Lock className="w-3 h-3 fill-current animate-pulse" /> Secure Access
                        </div>
                        <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tighter leading-[0.9] text-slate-900 dark:text-white">
                            Welcome <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-primary/80 to-primary/50 filter drop-shadow-sm">Back</span>
                            <span className="text-primary">.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                            Access your execution workspace, manage strategies, and track live performance.
                            <span className="block mt-2 font-medium text-slate-900 dark:text-white">Institutional-grade security with premium controls.</span>
                        </p>
                    </div>

                    <div className="w-full lg:max-w-md animate-in fade-in slide-in-from-right-8 duration-700 delay-150 order-1 lg:order-2">
                        <Card className="border-0 shadow-2xl shadow-primary/5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl ring-1 ring-slate-200 dark:ring-white/10 rounded-[2rem] overflow-hidden">
                            <CardContent className="p-4 sm:p-8">
                                <div className="mb-4 sm:mb-8">
                                    <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Sign In</h2>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Enter your credentials to continue securely.</p>
                                </div>

                                {!showVerify ? (
                                    <form onSubmit={onSubmit} className="space-y-3 sm:space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-5 h-5 text-slate-700 dark:text-slate-200 pointer-events-none" />
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    required
                                                    placeholder="trader@mspk.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="h-10 sm:h-12 rounded-xl pl-11 bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 focus:ring-primary/20 focus:border-primary"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Password</Label>
                                                <Link href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">Need password help?</Link>
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-5 h-5 text-slate-700 dark:text-slate-200 pointer-events-none" />
                                                <Input
                                                    id="password"
                                                    name="password"
                                                    type={showPassword ? "text" : "password"}
                                                    required
                                                    placeholder="********"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="h-10 sm:h-12 rounded-xl pl-11 pr-11 bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 focus:ring-primary/20 focus:border-primary"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((prev) => !prev)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 dark:text-slate-300 hover:text-primary transition-colors"
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full h-10 sm:h-12 rounded-xl text-sm sm:text-base font-bold bg-primary text-black hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200 mt-1"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Authenticating...</>
                                            ) : (
                                                'Secure Sign In'
                                            )}
                                        </Button>

                                        {loginError ? (
                                            <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-100">
                                                {loginError}
                                            </div>
                                        ) : null}

                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Email not verified?</span>
                                            <button
                                                type="button"
                                                onClick={onSendOtp}
                                                className="text-primary hover:text-primary/80 transition-colors"
                                            >
                                                Verify Email
                                            </button>
                                        </div>

                                        <div className="relative my-4">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t border-slate-200 dark:border-white/10" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-white dark:bg-black px-2 text-muted-foreground">
                                                    Or continue using demo
                                                </span>
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-10 sm:h-12 rounded-xl text-sm sm:text-base font-bold border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-200"
                                            onClick={() => router.push('/dashboard')}
                                        >
                                            <LayoutDashboard className="w-4 h-4 mr-2" /> Demo Login
                                        </Button>
                                    </form>
                                ) : (
                                    <div className="space-y-3 sm:space-y-4">
                                        <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 p-4 space-y-3">
                                            <div className="text-xs text-muted-foreground">
                                                {otpNotice || `Enter OTP sent to ${email || 'your email'}.`}
                                            </div>
                                            <div className="space-y-3">
                                                <Input
                                                    id="otp"
                                                    name="otp"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    required
                                                    placeholder="Enter OTP"
                                                    className="h-10 sm:h-11 rounded-xl bg-white/80 dark:bg-black/40 border-slate-200 dark:border-white/10 focus:ring-primary/20 focus:border-primary px-4"
                                                />
                                                {otpError ? (
                                                    <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-xs text-rose-700 dark:text-rose-100">
                                                        {otpError}
                                                    </div>
                                                ) : null}
                                                <div className="flex gap-2">
                                                    <Button type="button" onClick={onVerifyOtp} className="h-10 sm:h-11 rounded-xl flex-1" disabled={loading}>
                                                        Verify OTP
                                                    </Button>
                                                    <Button type="button" variant="outline" className="h-10 sm:h-11 rounded-xl" onClick={onSendOtp} disabled={loading}>
                                                        Resend
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="w-full h-10 sm:h-11 rounded-xl text-primary hover:text-primary hover:bg-primary/5"
                                            onClick={() => setShowVerify(false)}
                                        >
                                            Back to Login
                                        </Button>
                                    </div>
                                )}

                            </CardContent>
                            <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-white/5 border-t border-slate-200 dark:border-white/5 text-center">
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    Don&apos;t have an account?{' '}
                                    <Link href="/trial" className="font-bold text-primary hover:underline underline-offset-4">
                                        Start Premium Trial
                                    </Link>
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
