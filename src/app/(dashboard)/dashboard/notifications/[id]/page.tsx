"use client";

import Link from "next/link";
import { use } from "react";
import { useNotificationQuery } from "@/services/notifications/notification.hooks";
import { Card, CardContent } from "@/components/ui/card";

export default function NotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useNotificationQuery(id);

  return (
    <div className="flex-1 space-y-6 py-2">
      <Link href="/dashboard/notifications" className="text-sm text-primary">← Back to notifications</Link>
      <Card className="border-border/60 bg-white/80 dark:bg-white/5 rounded-[1.5rem]">
        <CardContent className="p-6 space-y-3 text-sm text-muted-foreground">
          {isLoading ? (
            "Loading..."
          ) : (
            <>
              <div className="text-lg font-semibold text-foreground">{data?.title || "Notification"}</div>
              <div>{data?.message || data?.body || "No details available."}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {data?.createdAt ? new Date(data.createdAt).toLocaleString() : ""}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
