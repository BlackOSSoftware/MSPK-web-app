import type { Metadata } from \"next\";
import { buildMetadata } from \"@/lib/seo\";

export const metadata: Metadata = buildMetadata({
  title: \"Strategies\",
  description: \"Explore MSPK trading strategies and execution approaches.\",
  path: \"/dashboard/strategies\",
  index: false,
});
