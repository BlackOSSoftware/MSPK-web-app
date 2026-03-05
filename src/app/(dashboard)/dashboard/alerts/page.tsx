"use client";

import React, { useState } from 'react';
import { Send, Smartphone, Bell, Save, Loader2, Check } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function AlertsPage() {
    const [settings, setSettings] = useState({
        telegram: { enabled: true, chatId: '@aqib_trade' },
        whatsapp: { enabled: false, number: '' },
        push: { enabled: true }
    });
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => setSaving(false), 1000);
    };

    const toggle = (channel: keyof typeof settings) => {
        setSettings(prev => ({
            ...prev,
            [channel]: { ...prev[channel], enabled: !prev[channel].enabled }
        }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Bell className="text-primary" /> Signal Channels
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Connect your devices to receive real-time trading signals.</p>
            </div>

            <div className="bg-card/50 border border-border rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Send size={16} className="text-blue-500" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Reception Channels</h3>
                    </div>
                    <span className="text-[10px] text-emerald-500 font-bold font-mono uppercase">System Online</span>
                </div>

                <div className="p-6 space-y-8">
                    {/* Telegram */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                                    Telegram Bot
                                    {settings.telegram.enabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                                </div>
                                <div className="text-xs text-muted-foreground">Receive instant signals via our Telegram Bot</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.telegram.enabled}
                                    onChange={() => toggle('telegram')}
                                />
                                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        {settings.telegram.enabled && (
                            <div className="pl-4 border-l-2 border-primary/20 animate-in fade-in slide-in-from-top-2">
                                <input
                                    type="text"
                                    value={settings.telegram.chatId}
                                    onChange={(e) => setSettings(p => ({ ...p, telegram: { ...p.telegram, chatId: e.target.value } }))}
                                    placeholder="Your Telegram User ID / Username"
                                    className="bg-secondary/30 border border-border rounded px-3 py-2 text-xs font-mono w-full md:w-1/2 focus:border-primary/50 focus:outline-none transition-colors"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">Start the bot <span className="text-primary cursor-pointer hover:underline">@MspkTradingBot</span> to get your ID.</p>
                            </div>
                        )}
                    </div>

                    <div className="h-[1px] bg-border/50"></div>

                    {/* WhatsApp */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                                    WhatsApp
                                    {settings.whatsapp.enabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                                </div>
                                <div className="text-xs text-muted-foreground">Receive alerts on your WhatsApp number</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.whatsapp.enabled}
                                    onChange={() => toggle('whatsapp')}
                                />
                                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        {settings.whatsapp.enabled && (
                            <div className="pl-4 border-l-2 border-primary/20 animate-in fade-in slide-in-from-top-2">
                                <input
                                    type="text"
                                    value={settings.whatsapp.number}
                                    onChange={(e) => setSettings(p => ({ ...p, whatsapp: { ...p.whatsapp, number: e.target.value } }))}
                                    placeholder="WhatsApp Number (with Country Code)"
                                    className="bg-secondary/30 border border-border rounded px-3 py-2 text-xs font-mono w-full md:w-1/2 focus:border-primary/50 focus:outline-none transition-colors"
                                />
                            </div>
                        )}
                    </div>

                    <div className="h-[1px] bg-border/50"></div>

                    {/* Push */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                                    Browser Push
                                    {settings.push.enabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                                </div>
                                <div className="text-xs text-muted-foreground">Instant browser notifications (WebSockets)</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.push.enabled}
                                    onChange={() => toggle('push')}
                                />
                                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-primary text-black hover:bg-primary/90 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Save Configuration
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
