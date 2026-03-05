import { useQuery } from "@tanstack/react-query";
import { getBotStatus } from "./bot.service";

export const BOT_STATUS_QUERY_KEY = ["bot", "status"] as const;

export function useBotStatusQuery(enabled = true) {
  return useQuery({
    queryKey: BOT_STATUS_QUERY_KEY,
    queryFn: getBotStatus,
    enabled,
  });
}
