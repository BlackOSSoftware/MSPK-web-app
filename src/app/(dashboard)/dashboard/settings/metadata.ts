import type { Metadata } from \"next\";
import { buildMetadata } from \"@/lib/seo\";

export const metadata: Metadata = buildMetadata({
  title: \"Settings\",
  description: \"Configure your MSPK dashboard preferences, alerts, and delivery channels.\",
  path: \"/dashboard/settings\",
  index: false,
});
