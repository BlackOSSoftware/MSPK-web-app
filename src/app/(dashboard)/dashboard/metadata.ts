import type { Metadata } from \"next\";
import { buildMetadata } from \"@/lib/seo\";

export const metadata: Metadata = buildMetadata({
  title: \"Dashboard Overview\",
  description: \"View plan status, signal activity, and performance highlights in your MSPK client dashboard.\",
  path: \"/dashboard\",
  index: false,
});
