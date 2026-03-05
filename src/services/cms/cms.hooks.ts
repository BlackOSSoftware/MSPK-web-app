import { useQuery } from "@tanstack/react-query";
import { getCmsFaqs, getCmsPage } from "./cms.service";

export const CMS_QUERY_KEY = ["cms"] as const;

export function useCmsPageQuery(slug: string, enabled = true) {
  return useQuery({
    queryKey: [...CMS_QUERY_KEY, "page", slug],
    queryFn: () => getCmsPage(slug),
    enabled: enabled && Boolean(slug),
  });
}

export function useCmsFaqsQuery(enabled = true) {
  return useQuery({
    queryKey: [...CMS_QUERY_KEY, "faqs"],
    queryFn: getCmsFaqs,
    enabled,
  });
}
