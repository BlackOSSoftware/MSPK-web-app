export type DashboardTicketItem = {
  _id: string;
  subject: string;
  ticketType: string;
  description: string;
  contactEmail: string;
  contactNumber: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateDashboardTicketPayload = {
  subject: string;
  ticketType: string;
  description: string;
  contactEmail: string;
  contactNumber: string;
};
