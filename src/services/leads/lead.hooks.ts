import { useMutation } from "@tanstack/react-query";
import { createLead } from "./lead.service";
import type { CreateLeadPayload } from "./lead.types";

export function useCreateLeadMutation() {
  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => createLead(payload),
  });
}
