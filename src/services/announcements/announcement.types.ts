export type AnnouncementItem = {
  _id: string;
  title?: string;
  summary?: string;
  description?: string;
  status?: string;
  type?: string;
  priority?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AnnouncementListResponse = {
  results?: AnnouncementItem[];
  pagination?: {
    page?: number;
    limit?: number;
    totalPages?: number;
    totalResults?: number;
  };
};
