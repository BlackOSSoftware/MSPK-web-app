import type { Metadata } from \"next\";
import { buildMetadata } from \"@/lib/seo\";

export const metadata: Metadata = buildMetadata({
  title: \"Plans & Billing\",
  description: \"Review plans, pricing, and subscription status for your MSPK Trade Solutions account.\",
  path: \"/dashboard/plans\",
  index: false,
});
