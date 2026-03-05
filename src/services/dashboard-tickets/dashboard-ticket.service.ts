import { apiClient } from "@/services/http/client";
import type { CreateDashboardTicketPayload, DashboardTicketItem } from "./dashboard-ticket.types";

export async function getDashboardTickets(): Promise<DashboardTicketItem[]> {
  const response = await apiClient.get<DashboardTicketItem[]>("/dashboard/tickets");
  return response.data;
}

export async function createDashboardTicket(payload: CreateDashboardTicketPayload): Promise<DashboardTicketItem> {
  const response = await apiClient.post<DashboardTicketItem>("/dashboard/tickets", payload);
  return response.data;
}
