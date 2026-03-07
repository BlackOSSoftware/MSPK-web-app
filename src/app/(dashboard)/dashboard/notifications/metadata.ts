import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Notifications",
  description: "View system and signal notifications for your MSPK account.",
  path: "/dashboard/notifications",
  index: false,
  keywords: [
    "notifications",
    "signal notifications",
    "account alerts",
    "system updates",
    "mspk notifications",
    "trade updates",
    "message center",
    "alert inbox",
    "status updates",
    "notification feed"
  ],
});

