export type TicketStatus = "pending" | "resolved" | "rejected" | string;

export type TicketUser = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
};

export type TicketItem = {
  _id: string;
  ticketId: string;
  user?: TicketUser;
  subject: string;
  ticketType: string;
  description: string;
  contactEmail: string;
  contactNumber: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateTicketPayload = {
  subject: string;
  ticketType: string;
  description: string;
  contactEmail: string;
  contactNumber: string;
};
