import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Support",
  description: "Get help, raise tickets, and connect with MSPK support.",
  path: "/dashboard/support",
  index: false,
  keywords: [
    "support",
    "help desk",
    "customer support",
    "ticket",
    "mspk support",
    "assistance",
    "contact support",
    "issue help",
    "service desk",
    "account help"
  ],
});

