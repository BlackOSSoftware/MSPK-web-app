import type { Metadata } from \"next\";
import { buildMetadata } from \"@/lib/seo\";

export const metadata: Metadata = buildMetadata({
  title: \"Live Signals\",
  description: \"Monitor live trading signals with entry, targets, and risk details.\",
  path: \"/dashboard/signals\",
  index: false,
});
