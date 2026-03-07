import type { Metadata } from \"next\";
import { buildMetadata } from \"@/lib/seo\";

export const metadata: Metadata = buildMetadata({
  title: \"Reports\",
  description: \"Analyze performance reports and trading summaries.\",
  path: \"/dashboard/reports\",
  index: false,
});
