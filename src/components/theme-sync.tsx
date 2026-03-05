"use client";

import { useEffect } from 'react';

export function ThemeSync() {
    useEffect(() => {
        const syncFont = () => {
            const savedFont = localStorage.getItem('theme-font');
            if (savedFont) {
                document.documentElement.style.setProperty('--font-primary', savedFont);
            }
        };

        // Initial sync
        syncFont();

        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'theme-font') {
                syncFont();
            }
        };

        // Listen for storage changes (for cross-tab sync)
        window.addEventListener('storage', handleStorage);

        // Custom event for same-tab sync
        window.addEventListener('theme-changed', syncFont);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('theme-changed', syncFont);
        };
    }, []);

    return null;
}
