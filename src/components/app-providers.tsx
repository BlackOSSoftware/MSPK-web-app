"use client";

import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ClickSoundProvider } from "@/components/click-sound-provider";
import { AppRuntime } from "@/components/app-runtime";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <ClickSoundProvider>
          {children}
          <AppRuntime />
          <Toaster position="top-center" richColors />
        </ClickSoundProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
