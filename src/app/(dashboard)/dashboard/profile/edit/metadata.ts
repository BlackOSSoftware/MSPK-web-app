import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Edit Profile",
  description: "Edit your MSPK account details and personal information.",
  path: "/dashboard/profile/edit",
  index: false,
  keywords: [
    "edit profile",
    "update profile",
    "account details",
    "personal information",
    "profile edit",
    "mspk account",
    "update details",
    "user info",
    "profile update",
    "account settings"
  ],
});

