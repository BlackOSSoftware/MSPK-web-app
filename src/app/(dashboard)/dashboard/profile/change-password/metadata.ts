import type { Metadata } from \"next\";
import { buildMetadata } from \"@/lib/seo\";

export const metadata: Metadata = buildMetadata({
  title: \"Change Password\",
  description: \"Update your MSPK account password securely.\",
  path: \"/dashboard/profile/change-password\",
  index: false,
});
