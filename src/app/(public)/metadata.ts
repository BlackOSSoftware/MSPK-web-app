import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Client Access",
  description: "Access the MSPK Trade Solutions client portal securely.",
  path: "/",
  index: false,
});
