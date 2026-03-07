import type { Metadata } from \"next\";
import { buildMetadata } from \"@/lib/seo\";

export const metadata: Metadata = buildMetadata({
  title: \"Privacy Policy\",
  description: \"Review MSPK Trade Solutions privacy practices and data handling details.\",
  path: \"/dashboard/privacy-policy\",
  index: false,
});
