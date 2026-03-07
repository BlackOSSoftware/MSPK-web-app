import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: "Review MSPK Trade Solutions privacy practices and data handling details.",
  path: "/dashboard/privacy-policy",
  index: false,
  keywords: [
    "privacy policy",
    "data privacy",
    "user privacy",
    "data handling",
    "mspk privacy",
    "policy details",
    "privacy notice",
    "data protection",
    "personal data",
    "privacy terms"
  ],
});

