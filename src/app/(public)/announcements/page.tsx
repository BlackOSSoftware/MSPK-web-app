"use client";

import Link from "next/link";
import { useAnnouncementsQuery } from "@/services/announcements/announcement.hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AnnouncementsPage() {
  const { data } = useAnnouncementsQuery({ status: "active", page: 1, limit: 20 });
  const announcements = data?.results ?? [];
  const exportUrl = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/announcements/export`
    : "#";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full max-w-6xl mx-auto px-6 py-20 space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">Announcements</h1>
            <p className="text-sm text-muted-foreground">Official updates, maintenance windows, and releases.</p>
          </div>
          <Link href={exportUrl} target="_blank">
            <Button variant="outline" className="rounded-xl h-11">Export</Button>
          </Link>
        </div>

        <div className="grid gap-4">
          {announcements.length === 0 ? (
            <Card className="border-border/60 bg-white/80 dark:bg-white/5 rounded-[1.5rem]">
              <CardContent className="p-6 text-sm text-muted-foreground">No announcements available.</CardContent>
            </Card>
          ) : (
            announcements.map((item) => (
              <Link key={item._id} href={`/announcements/${item._id}`}>
                <Card className="border-border/60 bg-white/80 dark:bg-white/5 rounded-[1.5rem] transition hover:border-primary/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{item.title || "Announcement"}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <div>{item.summary || item.description || "View details"}</div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      {item.type || "General"} {item.priority ? `• ${item.priority}` : ""}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
