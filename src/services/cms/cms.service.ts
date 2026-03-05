import { apiClient } from "@/services/http/client";
import type { CmsFaq, CmsPage } from "./cms.types";

export async function getCmsPage(slug: string): Promise<CmsPage> {
  const response = await apiClient.get<CmsPage>(`/cms/pages/${slug}`);
  return response.data;
}

export async function getCmsFaqs(): Promise<CmsFaq[]> {
  const response = await apiClient.get<CmsFaq[]>("/cms/faqs");
  return response.data;
}
