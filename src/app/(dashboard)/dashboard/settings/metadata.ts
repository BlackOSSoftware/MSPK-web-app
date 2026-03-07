import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Settings",
  description: "Configure your MSPK dashboard preferences, alerts, and delivery channels.",
  path: "/dashboard/settings",
  index: false,
  keywords: [
    "settings",
    "preferences",
    "account settings",
    "notification settings",
    "delivery channels",
    "profile settings",
    "security settings",
    "mspk settings",
    "dashboard settings",
    "alert preferences"
  ],
});

