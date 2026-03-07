import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Signal Alerts",
  description: "Manage MSPK trading alerts and delivery preferences for real-time signal updates.",
  path: "/dashboard/alerts",
  index: false,
  keywords: [
    "signal alerts",
    "trade alerts",
    "price alerts",
    "notification settings",
    "mspk alerts",
    "real time alerts",
    "trade notifications",
    "alert preferences",
    "signal delivery",
    "execution alerts"
  ],
});

