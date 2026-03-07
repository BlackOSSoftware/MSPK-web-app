import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Notification Details",
  description: "Read notification details and updates from MSPK Trade Solutions.",
  path: "/dashboard/notifications",
  index: false,
  keywords: [
    "notification details",
    "alert details",
    "message view",
    "signal update",
    "account notice",
    "trade notice",
    "system message",
    "notification info",
    "update details",
    "mspk alerts"
  ],
});

