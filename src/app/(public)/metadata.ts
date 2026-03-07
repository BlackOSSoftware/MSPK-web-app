import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Client Access",
  description: "Access the MSPK Trade Solutions client portal securely.",
  path: "/",
  index: false,
  keywords: [
    "mspk",
    "mspk trade solutions",
    "trading signals",
    "client portal",
    "secure login",
    "signal dashboard",
    "market alerts",
    "risk management",
    "premium trading",
    "execution insights"
  ],
});

