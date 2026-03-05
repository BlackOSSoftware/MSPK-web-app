"use client";

import { useMemo } from "react";
import {
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/services/notifications/notification.hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, Trash2 } from "lucide-react";

export default function NotificationsPage() {
  const { data, isLoading } = useNotificationsQuery();
  const notifications = Array.isArray(data) ? data : data?.results ?? [];
  const unreadCount = Array.isArray(data)
    ? notifications.filter((item) => !item.isRead).length
    : data?.unreadCount ?? notifications.filter((item) => !item.isRead).length;
  const markAllMutation = useMarkAllNotificationsReadMutation();
  const markOneMutation = useMarkNotificationReadMutation();
  const deleteMutation = useDeleteNotificationMutation();

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [notifications]);

  return (
    <div className="flex-1 space-y-6 sm:space-y-8 py-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread updates` : "All caught up"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-xl"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending || notifications.length === 0}
          >
            Mark all read
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card className="border-border/60 bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-[1.25rem]">
            <CardContent className="py-8 text-sm text-muted-foreground">Loading notifications...</CardContent>
          </Card>
        ) : sortedNotifications.length === 0 ? (
          <Card className="border-border/60 bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-[1.25rem]">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
              </div>
              No notifications yet.
            </CardContent>
          </Card>
        ) : (
          sortedNotifications.map((item) => (
            <a key={item._id} href={`/dashboard/notifications/${item._id}`}>
              <Card
                className={`border-border/60 rounded-[1.25rem] transition-all ${
                  item.isRead ? "bg-white/70 dark:bg-white/5" : "bg-primary/10 dark:bg-primary/15 border-primary/30"
                }`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{item.title || "Notification"}</CardTitle>
                  <CardDescription>
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Just now"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p className="text-sm text-foreground/80">{item.message || item.body || "Update received."}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl"
                      onClick={(e) => {
                        e.preventDefault();
                        markOneMutation.mutate(item._id);
                      }}
                      disabled={markOneMutation.isPending || Boolean(item.isRead)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark read
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        deleteMutation.mutate(item._id);
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
