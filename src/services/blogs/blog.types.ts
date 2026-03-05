export interface BlogMeta {
  title?: string;
  description?: string;
  image?: string;
}

export interface BlogItem {
  _id: string;
  title: string;
  slug: string;
  heroImage?: string;
  content: string;
  categories?: string[];
  relatedPosts?: string[];
  meta?: BlogMeta;
  publishedAt?: string;
  status?: "draft" | "published";
  createdAt?: string;
}

export interface BlogListResponse {
  results: BlogItem[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}
