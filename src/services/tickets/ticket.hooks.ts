import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTicket, getTickets } from "./ticket.service";
import type { CreateTicketPayload, TicketItem } from "./ticket.types";

export const TICKETS_QUERY_KEY = ["support", "tickets"] as const;

export function useTicketsQuery(enabled = true) {
  return useQuery({
    queryKey: TICKETS_QUERY_KEY,
    queryFn: getTickets,
    enabled,
  });
}

export function useCreateTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => createTicket(payload),
    onSuccess: (createdTicket) => {
      queryClient.setQueryData<TicketItem[]>(TICKETS_QUERY_KEY, (previous) => {
        const current = Array.isArray(previous) ? previous : [];
        const alreadyExists = current.some((item) => item._id === createdTicket._id);
        if (alreadyExists) {
          return current.map((item) => (item._id === createdTicket._id ? { ...item, ...createdTicket } : item));
        }
        return [createdTicket, ...current];
      });
      queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
    },
  });
}
