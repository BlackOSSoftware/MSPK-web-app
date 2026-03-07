import type { Metadata } from "next";

export const siteUrl = new URL("https://user.mspktradesolutions.com");
export const siteName = "MSPK Trade Solutions";
export const defaultDescription =
  "Institutional-grade trading signals with disciplined risk and premium execution clarity.";

export type SeoParams = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
};

export function buildMetadata({
  title,
  description,
  path,
  index = false,
}: SeoParams): Metadata {
  const canonicalUrl = new URL(path, siteUrl).toString();

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false, noarchive: true, nosnippet: true },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName,
      locale: "en_IN",
      type: "website",
      images: ["/logo.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/logo.jpg"],
    },
  } satisfies Metadata;
}
