"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

const CANDLE_COUNT = 18;

type CandleLoaderSize = "sm" | "md" | "lg";

type CandleLoaderProps = {
  label?: string;
  size?: CandleLoaderSize;
  className?: string;
};

const sizeClassMap: Record<CandleLoaderSize, string> = {
  sm: "candle-loader--sm",
  md: "candle-loader--md",
  lg: "candle-loader--lg",
};

export function CandleLoader({ label = "MSPK", size = "md", className }: CandleLoaderProps) {
  const style = {
    "--candle-green": "#166534",
    "--candle-red": "#dc2626",
  } as CSSProperties;

  return (
    <div
      className={cn("candle-loader", sizeClassMap[size], className)}
      style={style}
      role="status"
      aria-live="polite"
      aria-label={`${label} loading`}
    >
      <div className="candle-loader__chart" aria-hidden="true">
        {Array.from({ length: CANDLE_COUNT }).map((_, index) => (
          <span key={`candle-${index}`} className="candle-loader__candle" />
        ))}
      </div>
      <div className="candle-loader__label">{label}</div>
    </div>
  );
}
