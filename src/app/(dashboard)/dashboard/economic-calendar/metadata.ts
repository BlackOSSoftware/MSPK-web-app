import type { Metadata } from \"next\";
import { buildMetadata } from \"@/lib/seo\";

export const metadata: Metadata = buildMetadata({
  title: \"Economic Calendar\",
  description: \"Stay aware of macro events with the MSPK economic calendar.\",
  path: \"/dashboard/economic-calendar\",
  index: false,
});
