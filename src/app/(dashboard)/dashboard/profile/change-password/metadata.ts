import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Change Password",
  description: "Update your MSPK account password securely.",
  path: "/dashboard/profile/change-password",
  index: false,
  keywords: [
    "change password",
    "password update",
    "account security",
    "security settings",
    "reset password",
    "credential update",
    "mspk security",
    "secure account",
    "password management",
    "profile security"
  ],
});

