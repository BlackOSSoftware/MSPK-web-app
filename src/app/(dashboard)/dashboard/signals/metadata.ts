import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Live Signals",
  description: "Monitor live trading signals with entry, targets, and risk details.",
  path: "/dashboard/signals",
  index: false,
  keywords: [
    "live signals",
    "trading signals",
    "entry targets",
    "signal feed",
    "mspk signals",
    "real time signals",
    "trade alerts",
    "market signals",
    "signal dashboard",
    "execution signals"
  ],
});

