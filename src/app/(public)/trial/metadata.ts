import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Premium Trial Signup",
  description: "Start your MSPK Trade Solutions premium trial with verified onboarding and real-time signal access.",
  path: "/trial",
  index: true,
  keywords: [
    "mspk trial",
    "premium trial",
    "trading signals",
    "signal service",
    "forex signals",
    "options signals",
    "mcx signals",
    "crypto signals",
    "nse signals",
    "trade solutions"
  ],
});

