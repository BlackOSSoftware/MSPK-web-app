import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Dashboard Overview",
  description: "View plan status, signal activity, and performance highlights in your MSPK client dashboard.",
  path: "/dashboard",
  index: false,
  keywords: [
    "dashboard",
    "trading dashboard",
    "mspk dashboard",
    "signal overview",
    "plan status",
    "performance snapshot",
    "client workspace",
    "execution insights",
    "portfolio view",
    "market signals"
  ],
});

