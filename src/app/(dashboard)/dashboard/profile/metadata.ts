import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Profile",
  description: "View your MSPK profile details and account information.",
  path: "/dashboard/profile",
  index: false,
  keywords: [
    "profile",
    "account profile",
    "user details",
    "personal info",
    "mspk profile",
    "account info",
    "member profile",
    "profile overview",
    "user account",
    "profile settings"
  ],
});

