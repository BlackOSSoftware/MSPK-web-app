import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Client Login",
  description: "Sign in to MSPK Trade Solutions to manage your signals, plans, and alerts securely.",
  path: "/login",
  index: false,
});
