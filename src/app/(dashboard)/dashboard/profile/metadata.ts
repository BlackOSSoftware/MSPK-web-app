import type { Metadata } from \"next\";
import { buildMetadata } from \"@/lib/seo\";

export const metadata: Metadata = buildMetadata({
  title: \"Profile\",
  description: \"View your MSPK profile details and account information.\",
  path: \"/dashboard/profile\",
  index: false,
});
