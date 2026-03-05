export type EconomicCalendarItem = {
  _id?: string;
  eventId?: string;
  country?: string;
  currency?: string;
  date?: string;
  event?: string;
  actual?: string;
  forecast?: string | null;
  previous?: string;
  impact?: string;
};

export type EconomicCalendarListResponse = {
  results?: EconomicCalendarItem[];
  pagination?: {
    page?: number;
    limit?: number;
    totalPages?: number;
    totalResults?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
};
