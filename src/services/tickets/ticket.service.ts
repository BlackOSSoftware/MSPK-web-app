import { apiClient } from "@/services/http/client";
import type { CreateTicketPayload, TicketItem } from "./ticket.types";

export async function getTickets(): Promise<TicketItem[]> {
  const response = await apiClient.get<TicketItem[]>("/tickets");
  return response.data;
}

export async function createTicket(payload: CreateTicketPayload): Promise<TicketItem> {
  const response = await apiClient.post<TicketItem>("/tickets", payload);
  return response.data;
}
