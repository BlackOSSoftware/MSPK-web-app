import { apiClient } from "@/services/http/client";
import type { BlogItem, BlogListResponse } from "./blog.types";

export async function getBlogs(params?: Record<string, string | number | boolean | undefined>): Promise<BlogListResponse> {
  const response = await apiClient.get<BlogListResponse>("/blogs", { params });
  return response.data;
}

export async function getBlogBySlug(slug: string): Promise<BlogItem> {
  const response = await apiClient.get<BlogItem>(`/blogs/slug/${slug}`);
  return response.data;
}
