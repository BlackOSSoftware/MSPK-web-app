import type { Metadata } from \"next\";
import { buildMetadata } from \"@/lib/seo\";

export const metadata: Metadata = buildMetadata({
  title: \"Notifications\",
  description: \"View system and signal notifications for your MSPK account.\",
  path: \"/dashboard/notifications\",
  index: false,
});
