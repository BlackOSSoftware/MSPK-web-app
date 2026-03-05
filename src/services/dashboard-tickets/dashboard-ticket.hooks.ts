import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDashboardTicket, getDashboardTickets } from "./dashboard-ticket.service";
import type { CreateDashboardTicketPayload, DashboardTicketItem } from "./dashboard-ticket.types";

export const DASHBOARD_TICKETS_QUERY_KEY = ["dashboard", "tickets"] as const;
const SUPPORT_TICKETS_QUERY_KEY = ["support", "tickets"] as const;

export function useDashboardTicketsQuery(enabled = true) {
  return useQuery({
    queryKey: DASHBOARD_TICKETS_QUERY_KEY,
    queryFn: getDashboardTickets,
    enabled,
  });
}

export function useCreateDashboardTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDashboardTicketPayload) => createDashboardTicket(payload),
    onSuccess: (createdTicket) => {
      queryClient.setQueryData<DashboardTicketItem[]>(DASHBOARD_TICKETS_QUERY_KEY, (previous) => {
        const current = Array.isArray(previous) ? previous : [];
        const alreadyExists = current.some((item) => item._id === createdTicket._id);
        if (alreadyExists) {
          return current.map((item) => (item._id === createdTicket._id ? { ...item, ...createdTicket } : item));
        }
        return [createdTicket, ...current];
      });

      queryClient.setQueryData<DashboardTicketItem[]>(SUPPORT_TICKETS_QUERY_KEY, (previous) => {
        const current = Array.isArray(previous) ? previous : [];
        const alreadyExists = current.some((item) => item._id === createdTicket._id);
        if (alreadyExists) {
          return current.map((item) => (item._id === createdTicket._id ? { ...item, ...createdTicket } : item));
        }
        return [createdTicket, ...current];
      });

      queryClient.invalidateQueries({ queryKey: DASHBOARD_TICKETS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SUPPORT_TICKETS_QUERY_KEY });
    },
  });
}
