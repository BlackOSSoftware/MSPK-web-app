import type { Metadata } from \"next\";
import { buildMetadata } from \"@/lib/seo\";

export const metadata: Metadata = buildMetadata({
  title: \"Edit Profile\",
  description: \"Edit your MSPK account details and personal information.\",
  path: \"/dashboard/profile/edit\",
  index: false,
});
