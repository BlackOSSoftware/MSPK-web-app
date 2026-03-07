import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Watchlist",
  description: "Track your preferred instruments and follow live signals from one watchlist.",
  path: "/dashboard/watchlist",
  index: false,
  keywords: [
    "watchlist",
    "market watch",
    "instrument list",
    "signal watchlist",
    "trading list",
    "asset tracking",
    "favorite symbols",
    "live signals",
    "market overview",
    "trade tracking"
  ],
});

