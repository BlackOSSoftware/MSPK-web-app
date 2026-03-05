import { useQuery } from "@tanstack/react-query";
import { getBlogBySlug, getBlogs } from "./blog.service";

export const BLOGS_QUERY_KEY = ["blogs"] as const;

export function useBlogsQuery(params?: Record<string, string | number | boolean | undefined>, enabled = true) {
  return useQuery({
    queryKey: [...BLOGS_QUERY_KEY, params ?? {}],
    queryFn: () => getBlogs(params),
    enabled,
  });
}

export function useBlogQuery(slug: string, enabled = true) {
  return useQuery({
    queryKey: [...BLOGS_QUERY_KEY, slug],
    queryFn: () => getBlogBySlug(slug),
    enabled: enabled && Boolean(slug),
  });
}
