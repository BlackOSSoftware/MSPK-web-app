"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type ClickSoundContextValue = {
    enabled: boolean;
    toggle: () => void;
    setEnabled: (value: boolean) => void;
    play: () => void;
};

const ClickSoundContext = createContext<ClickSoundContextValue | null>(null);
const STORAGE_KEY = "click-sound-enabled";

function shouldIgnoreTarget(target: HTMLElement | null) {
    if (!target) return true;
    if (target.closest("[data-click-sound='off']")) return true;
    return Boolean(target.closest("input, textarea, select, option, [contenteditable='true'], [contenteditable='']"));
}

export function ClickSoundProvider({ children }: { children: React.ReactNode }) {
    const [enabled, setEnabled] = useState(() => {
        if (typeof window === "undefined") return true;
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === "true") return true;
        if (stored === "false") return false;
        return true;
    });

    const enabledRef = useRef(enabled);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        enabledRef.current = enabled;
        if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, String(enabled));
        }
    }, [enabled]);

    const play = useCallback(() => {
        if (typeof window === "undefined") return;
        const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextConstructor) return;

        let audioContext = audioContextRef.current;
        if (!audioContext) {
            audioContext = new AudioContextConstructor();
            audioContextRef.current = audioContext;
        }

        if (audioContext.state === "suspended") {
            audioContext.resume().catch(() => undefined);
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const now = audioContext.currentTime;

        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(1200, now);
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(0.06, now + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.05);

        oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
        };
    }, []);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (!enabledRef.current) return;
            if (event.button !== 0) return;
            const target = event.target as HTMLElement | null;
            if (shouldIgnoreTarget(target)) return;
            play();
        };

        document.addEventListener("click", handleClick, true);
        return () => document.removeEventListener("click", handleClick, true);
    }, [play]);

    const contextValue = useMemo(
        () => ({
            enabled,
            toggle: () =>
                setEnabled((prev) => {
                    const next = !prev;
                    if (next) play();
                    return next;
                }),
            setEnabled,
            play,
        }),
        [enabled, play]
    );

    return <ClickSoundContext.Provider value={contextValue}>{children}</ClickSoundContext.Provider>;
}

export function useClickSound() {
    const context = useContext(ClickSoundContext);
    if (!context) {
        throw new Error("useClickSound must be used within ClickSoundProvider");
    }
    return context;
}
