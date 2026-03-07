import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Premium Trial Signup",
  description: "Start your MSPK Trade Solutions premium trial with verified onboarding and real-time signal access.",
  path: "/trial",
  index: true,
});
